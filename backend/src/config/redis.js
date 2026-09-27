// src/config/redis.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier centralise la connexion à notre serveur de cache Redis via la librairie 'ioredis'.
// Redis est une base de données en Mémoire Vive (RAM), ultra-rapide (réponses en sous-milliseconde).
// Nous l'utilisons pour mettre en cache les requêtes SQL fréquentes et pour alimenter BullMQ.

const Redis = require('ioredis');
require('dotenv').config();

// 💡 ASTUCE DE SENIOR : Instanciation du client Redis avec gestion d'erreurs et de reconnexion
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null, // Obligatoire pour la compatibilité future avec BullMQ !
    enableReadyCheck: false,
    retryStrategy(times) {
        // Stratégie de reconnexion exponentielle en cas de coupure Redis
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Événement déclenché lorsque la connexion avec Redis est établie
redis.on('connect', () => {
    console.log("⚡ Connecté avec succès au serveur Redis !");
});

// Événement déclenché en cas d'erreur de connexion à Redis
// 🚨 PIÈGE À ÉVITER : Si on n'écoute pas l'événement 'error', une déconnexion Redis fera crasher l'app Node.js !
redis.on('error', (err) => {
    console.error("❌ Erreur de connexion Redis :", err.message);
});

module.exports = redis;
