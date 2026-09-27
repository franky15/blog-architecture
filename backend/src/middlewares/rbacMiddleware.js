// src/middlewares/rbacMiddleware.js
// 📘 POURQUOI CE FICHIER S'APPELLE "RBAC" ?
// RBAC signifie "Role-Based Access Control" (Contrôle d'Accès Basé sur les Rôles).
// C'est le standard absolu de l'industrie (utilisé par AWS, Kubernetes, etc.) pour gérer la sécurité.
// Avoir un fichier nommé ainsi prouve que l'architecture suit les meilleures pratiques d'entreprise.
// 
// 📘 À QUOI SERT-IL ?
// C'est notre deuxième "Videur". Il se place TOUJOURS après 'authMiddleware' pour vérifier les droits de l'utilisateur sur l'espace.
// Son rôle : "Ok, je sais qui tu es grâce au JWT, mais as-tu le droit de modifier le 'Tech Blog' ?"
// C'est une "Factory Function" (Une fonction qui fabrique un middleware sur-mesure).

const pool = require('../config/db');

// allowedRoles est un tableau. Ex: ['Admin', 'Contributor'] transmis par la route lorsqu'on appel ce middleware ou fonction dans les routes
const requireRole = (allowedRoles) => {

    // On retourne le vrai middleware (req, res, next)
    // 💡 POURQUOI LE MOT 'RETURN' ICI ? 
    // 'requireRole' est l'Usine. Le mot 'return' sert à recracher la RECETTE fabriquée (la fonction enfant) et à la donner à Express.
    // Sans ce 'return', l'usine produirait du vide (undefined), et Express crasherait.
    return async (req, res, next) => {
        try {
            // 1. On récupère l'ID du user (injecté par le authMiddleware juste avant !) ici pas besoin de verifier car la validation s'est faite dans le authMiddleware
            const userId = req.user.id;

            // 2. On récupère l'ID de l'espace depuis l'URL 
            // Ex: Si la route est /api/spaces/2/articles, req.params.spaceId vaudra '2'  
            const spaceId = req.params.spaceId;

            //On a besoin de verifier ici car aucune validation n'a été faite avant (comme pour l'ID du user)
            if (!spaceId) {
                return res.status(400).json({ error: "L'ID de l'espace est requis dans l'URL." });
            }

            // 3. 🚨 Re-vérification en Base de données
            // On demande à MySQL si ce couple User/Space existe dans notre table des rôles
            const [rows] = await pool.execute(
                'SELECT role FROM user_spaces WHERE user_id = ? AND space_id = ?',
                [userId, spaceId]
            );

            // S'il n'y a aucune ligne, l'utilisateur ne fait même pas partie de cet espace !
            if (rows.length === 0) {
                return res.status(403).json({ error: "Accès refusé. Vous n'êtes pas membre de cet espace." });
            }

            const userRole = rows[0].role; // Ex: 'Reader'

            // 4. On vérifie si son rôle est dans la liste des rôles autorisés par la route
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: `Accès refusé. Niveau insuffisant. Requis : ${allowedRoles.join(' ou ')}.`
                });
            }

            // 5. Tout est bon ! 
            // On peut même décorer 'req' avec le rôle pour que le Controller puisse s'en servir
            req.userRole = userRole;

            // 6. On autorise le passage vers le Controller final
            next();

        } catch (error) {
            console.error("Erreur dans le middleware RBAC :", error);
            res.status(500).json({ error: "Erreur interne lors de la vérification des droits." });
        }
    };
};

module.exports = requireRole;
