// src/controllers/spaceController.js
const pool = require('../config/db');

// 📘 LE RÔLE DU CONTROLLER (UX vs Sécurité)
// Ce contrôleur ne sert pas de sécurité (contrairement à rbacMiddleware.js).
// Il est là uniquement pour l'Expérience Utilisateur (UX) du Frontend.
// Il va chercher le rôle de l'utilisateur et le renvoie en JSON au Frontend (React).
// React utilisera cette information pour afficher ou cacher des boutons de l'interface.
// Si un hacker bypassait le Frontend, c'est le rbacMiddleware sur les routes d'action qui le bloquerait.
const getUserRoleInSpace = async (req, res) => {
    try {
        const userId = req.user.id;
        const spaceId = req.params.spaceId;

        if (!spaceId) {
            return res.status(400).json({ error: "L'ID de l'espace est requis." });
        }

        const [rows] = await pool.execute(
            'SELECT role FROM user_spaces WHERE user_id = ? AND space_id = ?',
            [userId, spaceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non membre de cet espace." });
        }

        res.status(200).json({ role: rows[0].role });

    } catch (error) {
        console.error("Erreur lors de la récupération du rôle :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

module.exports = {
    getUserRoleInSpace
};
