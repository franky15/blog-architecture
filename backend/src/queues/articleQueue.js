// src/events/articleQueue.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier définit la File d'Attente (Queue) BullMQ pour les événements liés aux articles.
// BullMQ utilise notre connexion Redis pour stocker les tickets (Jobs) en attente.
// C'est le "Producteur" (Producer) : il permet au serveur Express de déposer des tâches à traiter plus tard.

const { Queue } = require('bullmq');
const redis = require('../config/redis');

// Nom de la file d'attente (Channel / Queue Name). 
// 🚨 IMPORTANT : Le Worker devra utiliser EXACTEMENT ce même nom ('article-notifications') !
const ARTICLE_QUEUE_NAME = 'article-notifications';

// Création de la Queue BullMQ alimentée par notre instance Redis 'ioredis'
const articleQueue = new Queue(ARTICLE_QUEUE_NAME, {
    connection: redis
});

/**
 * Dépose un ticket de notification d'article dans la file d'attente.
 * 
 * @param {Object} payload - Les données de l'article (id, title, authorEmail, spaceId)
 */
const addArticleNotificationJob = async (payload) => {
    try {
        // .add(nomDuTicket, payload, options)
        await articleQueue.add('notify-new-article', payload, {
            attempts: 3, // En cas d'échec du Worker, BullMQ réessaiera 3 fois maximum
            backoff: {
                type: 'exponential', // Attente exponentielle entre les tentatives (1s, 2s, 4s...)
                delay: 1000
            },
            removeOnComplete: true // Supprime le ticket de Redis une fois la tâche réussie pour préserver la mémoire
        });
        console.log(`📩 [BULLMQ QUEUE] Ticket de notification ajouté pour l'article "${payload.title}"`);
    } catch (error) {
        // En cas d'erreur de la Queue, on ne fait pas crasher l'API (Fail-Safe)
        console.error("❌ [BULLMQ QUEUE] Erreur lors de l'ajout du ticket :", error.message);
    }
};

module.exports = {
    articleQueue,
    addArticleNotificationJob
};
