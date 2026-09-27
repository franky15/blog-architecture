// src/routes/imageRoutes.js
// 📘 POURQUOI CE FICHIER ?
// Définit les routes relatives aux images (ex: recherche via l'API Unsplash).

const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route : GET /api/images/search?query=nature
// Protegée par authMiddleware : Seuls nos utilisateurs authentifiés (ayant un JWT valide) 
// ont le droit de faire consommer notre quota d'API Unsplash !
router.get('/search', authMiddleware, imageController.searchImages);

module.exports = router;
