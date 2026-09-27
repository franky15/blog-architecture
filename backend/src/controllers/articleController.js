// src/controllers/articleController.js
// 📘 POURQUOI CE FICHIER ?
// C'est le "Serveur" de notre restaurant. Il s'occupe de toutes les logiques métier liées aux Articles.
// Il ne s'occupe PAS de vérifier si tu es connecté ou de tes rôles. Ça, c'est le travail des Middlewares (les videurs) !
// Quand le code arrive ici, on est SÛR à 100% que l'utilisateur a le droit d'être là.
// ⚡ PATTERN CACHE-ASIDE (Lazy Loading) vs WRITE-THROUGH :
// Pourquoi fait-on un simple `deleteCache` lors des POST/PUT/DELETE au lieu de recréer le cache ?
// Parce qu'on est en "Lazy Loading". On ne charge les données en mémoire (RAM) QUE si un visiteur les demande.
// Cela économise de la RAM et évite de solliciter MySQL pour recréer une liste qui ne sera peut-être jamais lue !
// Le premier GET suivant l'invalidation déclenchera le "Cache MISS" et repeuplera Redis.


const pool = require('../config/db');
const cacheService = require('../services/cacheService');
const { addArticleNotificationJob } = require('../queues/articleQueue');

// 1. LIRE LES ARTICLES D'UN ESPACE (GET) - AVEC PAGINATION
const getArticlesBySpace = async (req, res) => {
    try {
        const spaceId = req.params.spaceId;
        
        // 📄 PAGINATION : Récupération des paramètres d'URL (ex: ?page=2&limit=5)
        // Si non fournis, on met par défaut page 1 et limite 10.
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Sécurité : On bride la limite à 50 max pour éviter qu'un malin fasse ?limit=100000 et crashe la BDD
        const safeLimit = Math.min(limit, 50); 
        
        // 📐 L'OFFSET : Combien de résultats doit-on "sauter" ? 
        // Ex: Page 1 = on saute 0. Page 2 (limit 10) = on saute les 10 premiers.
        const offset = (page - 1) * safeLimit;

        // 🔑 La clé de cache DOIT inclure la page ! Sinon la page 2 écrasera le cache de la page 1.
        const cacheKey = `space:${spaceId}:articles:page:${page}:limit:${safeLimit}`;

        // ⚡ Étape 1 - Lire Redis
        const cachedData = await cacheService.getCache(cacheKey);
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            return res.status(200).json(cachedData);
        }

        // ⚡ Étape 2 - Cache MISS, on tape dans MySQL

        // A. Compter le nombre TOTAL d'articles (indispensable pour que le frontend crée ses boutons [1] [2] [3])
        const countQuery = 'SELECT COUNT(*) as total FROM articles WHERE space_id = ?';
        const [[countResult]] = await pool.execute(countQuery, [spaceId]);
        const totalItems = countResult.total;
        const totalPages = Math.ceil(totalItems / safeLimit);

        // B. Récupérer uniquement les articles de la page demandée
        const query = `
            SELECT articles.id, articles.title, articles.content, articles.cover_image_url, articles.created_at, users.email AS author_email
            FROM articles
            JOIN users ON articles.author_id = users.id
            WHERE articles.space_id = ?
            ORDER BY articles.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        // 🚨 ATTENTION BDD : mysql2 demande souvent que LIMIT et OFFSET soient passés en String
        const [articles] = await pool.execute(query, [spaceId, safeLimit.toString(), offset.toString()]);

        const responseData = {
            data: articles,
            pagination: {
                currentPage: page,
                limit: safeLimit,
                totalItems,
                totalPages
            }
        };

        // ⚡ Étape 3 - Stocker dans Redis
        await cacheService.setCache(cacheKey, responseData, 300);

        res.set('X-Cache', 'MISS');
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erreur lors de la récupération des articles :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des articles." });
    }
};

// 1.5 LIRE UN SEUL ARTICLE (GET)
const getSingleArticle = async (req, res) => {
    try {
        const { spaceId, articleId } = req.params;
        
        const query = `
            SELECT articles.id, articles.title, articles.content, articles.cover_image_url, articles.created_at, users.email AS author_email
            FROM articles
            JOIN users ON articles.author_id = users.id
            WHERE articles.space_id = ? AND articles.id = ?
        `;
        
        const [rows] = await pool.execute(query, [spaceId, articleId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Article introuvable dans cet espace." });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'article :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération de l'article." });
    }
};

// 2. CRÉER UN ARTICLE (POST)
const createArticle = async (req, res) => {
    try {
        const spaceId = req.params.spaceId;

        // 💡 On récupère title, content et cover_image_url
        const { title, content, cover_image_url } = req.body;

        // 🚨 IMPORTANT : 'req.user.id' a été injecté par authMiddleware
        const authorId = req.user.id;

        // 🛡️ La validation (title, content) a DÉJÀ été faite par Joi (validateMiddleware).
        // Si le code arrive ici, on est SÛR à 100% que req.body est propre.

        // Requête d'insertion SQL
        const query = 'INSERT INTO articles (title, content, cover_image_url, author_id, space_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [title, content, cover_image_url || null, authorId, spaceId]);

        // 🧹 INVALIDATION GLOBALE DU CACHE 
        // Puisqu'on a maintenant plusieurs pages en cache (page:1, page:2...), 
        // la création d'un article décale TOUTES les pages ! On doit donc tout purger avec un Pattern (*).
        await cacheService.deleteCacheByPattern(`space:${spaceId}:articles:*`);

        // 🚀 BULLMQ : Déclencher la tâche asynchrone en arrière-plan (Producteur)
        // On n'attend PAS que l'email soit réellement envoyé pour répondre à l'utilisateur !
        addArticleNotificationJob({
            articleId: result.insertId,
            title,
            authorId,
            spaceId
        });

        res.status(201).json({ 
            message: "Article publié avec succès !", 
            articleId: result.insertId 
        });

    } catch (error) {
        console.error("Erreur lors de la création de l'article :", error);
        res.status(500).json({ error: "Erreur serveur lors de la création de l'article." });
    }
};

// 3. MODIFIER UN ARTICLE (PUT)
const updateArticle = async (req, res) => {
    try {
        const { spaceId, articleId } = req.params;
        const { title, content, cover_image_url } = req.body;

        // 1. On cherche l'article en BDD pour vérifier s'il existe dans cet espace
        const [rows] = await pool.execute(
            'SELECT * FROM articles WHERE id = ? AND space_id = ?',
            [articleId, spaceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Article introuvable dans cet espace." });
        }

        const article = rows[0];

        // 2. VÉRIFICATION DES DROITS (Propriétaire vs Admin)
        const isAdmin = req.userRole === 'Admin';
        const isAuthor = article.author_id === req.user.id;

        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ 
                error: "Accès refusé. Vous ne pouvez modifier que vos propres articles." 
            });
        }

        // 3. Validation Joi (Déjà effectuée en amont par le Middleware)
        // Les données title et content sont garanties.

        // 4. Mise à jour SQL
        const updateQuery = `
            UPDATE articles 
            SET title = ?, content = ?, cover_image_url = ? 
            WHERE id = ? AND space_id = ?
        `;
        await pool.execute(updateQuery, [title, content, cover_image_url || null, articleId, spaceId]);

        // 🧹 INVALIDATION GLOBALE DU CACHE
        // L'article est modifié, potentiellement présent sur n'importe quelle page. On purge tout.
        await cacheService.deleteCacheByPattern(`space:${spaceId}:articles:*`);

        res.status(200).json({ message: "Article mis à jour avec succès !" });

    } catch (error) {
        console.error("Erreur lors de la modification de l'article :", error);
        res.status(500).json({ error: "Erreur serveur lors de la modification de l'article." });
    }
};

// 4. SUPPRIMER UN ARTICLE (DELETE)
const deleteArticle = async (req, res) => {
    try {
        const { spaceId, articleId } = req.params;

        // 1. On cherche l'article en BDD pour vérifier s'il existe dans cet espace
        const [rows] = await pool.execute(
            'SELECT * FROM articles WHERE id = ? AND space_id = ?',
            [articleId, spaceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Article introuvable dans cet espace." });
        }

        const article = rows[0];

        // 2. VÉRIFICATION DES DROITS (Propriétaire vs Admin)
        const isAdmin = req.userRole === 'Admin';
        const isAuthor = article.author_id === req.user.id;

        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ 
                error: "Accès refusé. Vous ne pouvez supprimer que vos propres articles." 
            });
        }

        // 3. Suppression SQL
        await pool.execute('DELETE FROM articles WHERE id = ? AND space_id = ?', [articleId, spaceId]);

        // 🧹 INVALIDATION GLOBALE DU CACHE
        // La suppression décale toutes les pages suivantes. On purge tout.
        await cacheService.deleteCacheByPattern(`space:${spaceId}:articles:*`);

        res.status(200).json({ message: "Article supprimé avec succès !" });

    } catch (error) {
        console.error("Erreur lors de la suppression de l'article :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression de l'article." });
    }
};

module.exports = {
    getArticlesBySpace,
    getSingleArticle,
    createArticle,
    updateArticle,
    deleteArticle
};
