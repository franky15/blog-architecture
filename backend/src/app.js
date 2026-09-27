// src/app.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier est dédié UNIQUEMENT à la configuration de l'application Express (les middlewares, les routes).
// On sépare la configuration (app.js) du lancement du serveur (server.js) pour pouvoir 
// tester notre API facilement plus tard (avec un faux serveur).

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES GLOBAUX ---

// 1. Sécurité HTTP
// Helmet ajoute plein de "headers" (en-têtes HTTP) cachés pour protéger l'API contre des failles courantes (ex: XSS).
app.use(helmet()); 

// 2. Cross-Origin Resource Sharing (CORS)
// Autorise notre frontend (React) à faire des requêtes vers ce backend (sinon le navigateur bloque).
app.use(cors());

// 3. Parseur JSON
// Transforme les corps (body) de requêtes textes en objets JavaScript utilisables (req.body).
app.use(express.json()); 

// 4. Limiteur de Requêtes Global (Rate Limiter)
// On injecte le bouclier DDoS global pour TOUTES les routes.
const { globalLimiter } = require('./middlewares/rateLimiterMiddleware');
app.use(globalLimiter);

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const imageRoutes = require('./routes/imageRoutes');
const spaceRoutes = require('./routes/spaceRoutes');

// 1. Authentification
app.use('/api/auth', authRoutes);

// 2. Gestion des Espaces (Rôles, etc)
app.use('/api/spaces/:spaceId', spaceRoutes);

// 3. Articles (Les endpoints commenceront par /api/spaces/X/articles)
app.use('/api/spaces/:spaceId/articles', articleRoutes);

// 4. Images Externe (Proxy Unsplash)
app.use('/api/images', imageRoutes);

app.get('/health', (req, res) => {
    // Route de santé : très utilisée par les systèmes comme Kubernetes pour savoir si l'API est vivante.
    res.status(200).json({ status: "OK", message: "Le serveur Backend est en bonne santé !" });
});

// Exporte l'application configurée, mais NE LA DÉMARRE PAS.
module.exports = app;
