// src/workers/articleWorker.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier est le "Travailleur" (Worker / Consumer) de BullMQ.
// Il s'exécute en arrière-plan et écoute la file d'attente 'article-notifications'.
// Dès qu'un ticket est déposé par le serveur Express, le Worker le récupère et effectue
// le travail lourd (ex: envoi d'emails, calcul de statistiques, génération IA) sans bloquer l'API !

const { Worker } = require('bullmq');
const redis = require('../config/redis');

// Nom exact de la queue définie dans articleQueue.js c'est a partir de la que la connexion se fait avec 
// la queue grace a ce ARTICLE_QUEUE_NAME qui sert de canal de communication entre le producteur 
// (articleQueue.js) et le consommateur (articleWorker.js) les deux doivent avoir le meme nom
const ARTICLE_QUEUE_NAME = 'article-notifications';

// Instanciation du Worker
const articleWorker = new Worker(
    ARTICLE_QUEUE_NAME,
    async (job) => {
        // 💡 POURQUOI PAS DE TRY/CATCH GLOBAL ICI ?
        // Par défaut, BullMQ gère lui-même les erreurs. Si le code plante (ex: API externe inaccessible), 
        // l'erreur remonte naturellement, BullMQ l'intercepte, marque le ticket comme "Failed" (échoué), 
        // et planifie automatiquement un Retry (réessai) basé sur notre configuration `backoff`.
        // 🚨 Si on mettait un try/catch qui "étouffe" l'erreur (sans refaire un throw), BullMQ croirait 
        // que la tâche a réussi ! Le ticket serait détruit et ne serait jamais réessayé.

        // 💡 DEUXIÈME FAÇON DE FAIRE (Avec Try/Catch explicite + Throw) :
        // Si tu as VRAIMENT besoin d'un try/catch (ex: pour nettoyer un fichier temporaire avant de planter),
        // tu DOIS obligatoirement relancer l'erreur avec `throw` à la fin du catch.
        // 
        // ⚠️ EST-CE QUE CE 'THROW' FAIT PLANTER LE CONTROLLER OU L'API EXPRESS ?
        // ABSOLUMENT PAS ! Le Worker tourne en tâche de fond (Background Process). 
        // Il est totalement déconnecté de la requête HTTP initiale. 
        // Le Controller Express a déjà répondu "201 Created" à l'utilisateur depuis longtemps.
        // Ce `throw` sera uniquement intercepté par BullMQ et n'impactera JAMAIS ton routeur Express !

        /* EXEMPLE DE LA DEUXIÈME FAÇON :
        try {
            const { articleId, title, spaceId } = job.data;
            // ... Tâche lourde qui peut planter ...
        } catch (error) {
            console.error("Mon log de nettoyage avant crash :", error);
            // 🚨 ON RELANCE L'ERREUR OBLIGATOIREMENT POUR QUE BULLMQ DÉCLENCHE LE RETRY !
            throw error; 
        }
        */

        // --- CODE ACTUEL (1ère façon : on laisse remonter naturellement) ---
        // 'job.data' contient le payload transmis lors de articleQueue.add()
        const { articleId, title, spaceId } = job.data;

        console.log(`⚙️ [WORKER START] Traitement de la notification pour l'article ID ${articleId} : "${title}" (Espace ${spaceId})...`);

        // 🔥 EN CONDITIONS RÉELLES : On fait un véritable appel réseau (HTTP) vers un service externe.
        // Cela pourrait être l'API SendGrid (Emails), un Webhook Slack/Discord, ou une IA.
        // Ici, nous utilisons JSONPlaceholder (une fausse API gratuite) pour faire un vrai POST sur Internet.
        const webhookUrl = 'https://jsonplaceholder.typicode.com/posts';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Nouvel article publié !',
                body: `L'article "${title}" (ID: ${articleId}) a été publié dans l'espace ${spaceId}.`,
                userId: 1
            })
        });

        // 🚨 GESTION D'ERREUR RÉELLE (C'est ici que BullMQ brille !)
        // Si l'API externe est en panne ou renvoie une erreur (404, 500), response.ok sera 'false'.
        if (!response.ok) {
            // ON JETTE UNE ERREUR ! 
            // Le Worker s'arrête net. BullMQ l'intercepte, marque ce ticket comme "Failed",
            // et le remettra dans la file d'attente pour le réessayer plus tard (Backoff).
            throw new Error(`Échec de l'envoi au Webhook externe. Statut HTTP : ${response.status}`);
        }

        const responseData = await response.json();
        console.log(`✅ [WORKER COMPLETE] Notification envoyée avec succès au Webhook ! (ID de confirmation: ${responseData.id})`);
    },
    {
        connection: redis
    }
);

// Événement déclenché si le travailleur rencontre une erreur fatale dans son code
articleWorker.on('failed', (job, err) => {
    console.error(`💥 [WORKER ERROR] Le job ${job?.id} a échoué après plusieurs tentatives :`, err.message);
});

module.exports = articleWorker;
