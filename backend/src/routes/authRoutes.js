// src/routes/authRoutes.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier gère le "Standard téléphonique" pour l'authentification.
// Il relie les URLs tapées par l'utilisateur (ex: /register) vers les fonctions du Controller.

const express = require('express');
const router = express.Router(); // Création d'un mini-Express (un routeur)
const authController = require('../controllers/authController');

// Route POST : /api/auth/register
router.post('/register', authController.register);

// Route POST : /api/auth/login
router.post('/login', authController.login);

module.exports = router;
