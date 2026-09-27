// src/routes/articleRoutes.js
// 📘 POURQUOI CE FICHIER ?
// C'est ici que l'on construit notre chaîne de montage (L'URL -> Les Videurs -> Le Controller).
// C'est le fichier le plus important pour comprendre la sécurité de l'application !

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams permet de récupérer ':spaceId' depuis app.js l'url de la route fixée la bas dans app.js
const articleController = require('../controllers/articleController');

// Importation de nos 2 Videurs (Middlewares)
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/rbacMiddleware');

// 🛡️ NOUVEAUTÉ : Importation de Joi (Validation des données envoyées par le client)
const validate = require('../middlewares/validateMiddleware');
const { createArticleSchema, updateArticleSchema } = require('../validators/articleSchema');

// 🛡️ NOUVEAUTÉ : Limiteur de requêtes anti-spam
const { articleCreationLimiter } = require('../middlewares/rateLimiterMiddleware');

// ==========================================
// 1. ROUTE : Lire les articles d'un espace
// ==========================================
// - Endpoint: GET /api/spaces/:spaceId/articles
// - Sécurité: Il faut être connecté (auth) ET faire partie de l'espace (Admin, Contributor, ou Reader)
router.get(
    '/',
    // 🎒 LE SAC À DOS (req) : authMiddleware s'exécute en 1er et ajoute "req.user"
    authMiddleware,

    // 🎒 LE SAC À DOS (req) : La recette de requireRole s'exécute en 2ème, elle lit "req.user" et ajoute "req.userRole"
    // (Rappel : requireRole(['...']) s'allume au démarrage pour fabriquer la recette)
    requireRole(['Admin', 'Contributor', 'Reader']),
    articleController.getArticlesBySpace
);

// ==========================================
// 2. ROUTE : Publier un nouvel article
// ==========================================
// - Endpoint: POST /api/spaces/:spaceId/articles
// - Sécurité: Il faut être connecté (auth) ET avoir le droit d'écrire (Admin ou Contributor). 
// 🚨 Les simples "Reader" seront bloqués par le 2ème videur !
router.post(
    '/',
    authMiddleware,
    requireRole(['Admin', 'Contributor']),
    articleCreationLimiter,        // 🛡️ Le 3ème Videur : Es-tu un spammeur ? (Max 10 articles/heure)
    validate(createArticleSchema), // 🛡️ Le 4ème Videur : Vérifie la forme du JSON (titre min 5 char, etc.) avant le Controller !
    articleController.createArticle
);

// ==========================================
// 3. ROUTE : Lire un seul article
// ==========================================
// - Endpoint: GET /api/spaces/:spaceId/articles/:articleId
router.get(
    '/:articleId',
    authMiddleware,
    requireRole(['Admin', 'Contributor', 'Reader']),
    articleController.getSingleArticle
);

// ==========================================
// 4. ROUTE : Modifier un article existant
// ==========================================
// - Endpoint: PUT /api/spaces/:spaceId/articles/:articleId
// - Sécurité: Authentifié + Rôle 'Admin' ou 'Contributor'. 
// (Note: La vérification que le Contributor est bien l'auteur se fait dans le Controller !)
router.put(
    '/:articleId',
    authMiddleware,
    requireRole(['Admin', 'Contributor']),
    validate(updateArticleSchema), // 🛡️ Vérification stricte du JSON pour la mise à jour
    articleController.updateArticle
);

// ==========================================
// 4. ROUTE : Supprimer un article
// ==========================================
// - Endpoint: DELETE /api/spaces/:spaceId/articles/:articleId
// - Sécurité: Authentifié + Rôle 'Admin' ou 'Contributor'.
// (Note: Seul l'Auteur ou l'Admin de l'espace pourra valider la suppression dans le Controller !)
router.delete(
    '/:articleId',
    authMiddleware,
    requireRole(['Admin', 'Contributor']),
    articleController.deleteArticle
);

module.exports = router;
