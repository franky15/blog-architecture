// src/routes/spaceRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const spaceController = require('../controllers/spaceController');
const authMiddleware = require('../middlewares/authMiddleware');

// 📘 À QUOI SERT CETTE ROUTE (vs rbacMiddleware) ?
// Cette route est "L'Informateur" pour le Frontend (React).
// Son but n'est PAS de protéger des actions (c'est le rôle de rbacMiddleware.js).
// Son but est d'informer le navigateur : "Voici le rôle de l'utilisateur actuel dans cet espace."
// Ainsi, le Frontend pourra adapter son affichage (Ex: cacher le bouton "Supprimer" si le rôle est 'Reader').
// Route GET : /api/spaces/:spaceId/role
router.get('/role', authMiddleware, spaceController.getUserRoleInSpace);

module.exports = router;
