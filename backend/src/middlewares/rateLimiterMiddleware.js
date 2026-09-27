// src/middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');

// 🛡️ LIMITEUR GLOBAL (Pour l'ensemble de l'API)
// Empêche un pirate de faire tomber le serveur (Attaque DDoS) en martelant l'API.
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
    message: {
        error: "Trop de requêtes envoyées depuis cette adresse IP, veuillez réessayer dans 15 minutes."
    },
    standardHeaders: true, // Renvoie le statut dans les headers `RateLimit-*`
    legacyHeaders: false,  // Désactive les anciens headers `X-RateLimit-*`
});

// 🛡️ LIMITEUR STRICT (Spécifique pour la création d'articles POST)
// Empêche un bot ou un utilisateur malveillant de spammer la base de données.
const articleCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // Un utilisateur ne peut publier que 10 articles maximum par heure
    message: {
        error: "Vous publiez trop vite ! Limite atteinte (10 articles par heure). Prenez une pause et revenez plus tard."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    articleCreationLimiter
};
