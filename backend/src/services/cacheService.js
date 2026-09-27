// src/services/cacheService.js
// 📘 POURQUOI CE FICHIER ?
// Ce service agit comme une couche d'abstraction (un Proxy / Façade) au-dessus de Redis.
// Il implémente le pattern "Cache-Aside" avec une sécurité absolue (Fail-Safe / Graceful Degradation) :
// Si Redis tombe en panne, l'application ne doit JAMAIS crasher. Le service simule simplement un "Cache Miss"
// et laisse l'API aller chercher les données directement dans MySQL.

const redis = require('../config/redis');

/**
 * Récupère une valeur du cache Redis et la désérialise depuis le format JSON.
 * 
 * @param {string} key - La clé unique de cache (ex: 'space:1:articles')
 * @returns {Promise<any|null>} Les données parsées si trouvées (Cache HIT), sinon null (Cache MISS)
 */
const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        if (!data) {
            return null; // Cache MISS (Donnée non présente)
        }
        // 💡 JARGON : "Désérialisation" (Transformer du texte JSON brut en Objet/Tableau JS)
        return JSON.parse(data);
    } catch (error) {
        // 🚨 PRO-TIP (Graceful Degradation) :
        // Si Redis échoue, on affiche un avertissement dans les logs mais ON NE JETTE PAS d'erreur (pas de throw) !
        // En renvoyant null, le contrôleur pensera que c'est un Cache Miss et ira interroger MySQL.
        console.warn(`⚠️ [CACHE SERVICE] Impossible de lire la clé "${key}" dans Redis (Fallback vers DB) :`, error.message);
        return null;
    }
};

/**
 * Enregistre une valeur dans le cache Redis avec une durée de vie (TTL).
 * 
 * @param {string} key - La clé unique de cache
 * @param {any} value - Les données JavaScript (Objet, Tableau) à mettre en cache
 * @param {number} ttlInSeconds - Durée de vie en secondes (Time-To-Live). Défaut: 300s (5 min)
 */
const setCache = async (key, value, ttlInSeconds = 300) => {
    try {
        // 💡 JARGON : "Sérialisation" (Transformer un Objet JS en texte JSON brut pour le stockage)
        const serializedData = JSON.stringify(value);
        
        // 'EX' indique à Redis que la valeur doit expirer automatiquement dans X secondes
        await redis.set(key, serializedData, 'EX', ttlInSeconds);
    } catch (error) {
        console.warn(`⚠️ [CACHE SERVICE] Impossible d'écrire la clé "${key}" dans Redis :`, error.message);
    }
};

/**
 * Supprime une clé spécifique du cache Redis (Eviction Manuelle).
 * 
 * @param {string} key - La clé à supprimer
 */
const deleteCache = async (key) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.warn(`⚠️ [CACHE SERVICE] Impossible de supprimer la clé "${key}" dans Redis :`, error.message);
    }
};

/**
 * Supprime toutes les clés du cache correspondant à un pattern (ex: 'space:1:*').
 * Utile pour purger les caches d'un espace entier lors d'une modification.
 * 
 * @param {string} pattern - Le motif de recherche de clés (ex: 'space:1:*')
 */
const deleteCacheByPattern = async (pattern) => {
    try {
        // redis.keys retourne toutes les clés correspondant au pattern
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            // Le prefix 'del' avec l'opérateur spread (...) supprime toutes les clés en une seule opération
            await redis.del(...keys);
        }
    } catch (error) {
        console.warn(`⚠️ [CACHE SERVICE] Impossible de purger le pattern "${pattern}" dans Redis :`, error.message);
    }
};

module.exports = {
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern
};
