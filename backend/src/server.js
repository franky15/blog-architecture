// src/server.js
// 📘 POURQUOI CE FICHIER ?
// C'est le point d'entrée principal. Il importe 'app', la connecte à un port, et gère
// les problématiques d'infrastructure comme le "Graceful Shutdown".

require('dotenv').config();
const app = require('./app');
const pool = require('./config/db'); // On importe le pool MySQL pour pouvoir le fermer proprement
const redis = require('./config/redis'); // On importe le client Redis pour la fermeture propre
const articleWorker = require('./workers/articleWorker'); // Démarrage du Worker BullMQ en arrière-plan

const PORT = process.env.PORT || 3000;

// app.listen demande à Node.js d'ouvrir un port réseau et de se mettre sur écoute.
const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

// 🚨 GESTION DES ERREURS DU SERVEUR
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé par une autre application !`);
    } else {
        console.error(`❌ Erreur fatale du serveur HTTP :`, error);
    }
    process.exit(1);
});

// --- GRACEFUL SHUTDOWN (Arrêt en douceur) ---
// 💡 ASTUCE DE SENIOR : Fermer proprement MySQL ET Redis lors d'un signal d'arrêt (SIGINT/SIGTERM)
const shutdown = async () => {
    console.log("\n⚠️ Signal d'arrêt reçu (SIGINT/SIGTERM). Fermeture gracieuse en cours...");
    
    // 1. On arrête d'accepter de nouvelles requêtes HTTP
    server.close(async () => {
        console.log("🛑 Serveur HTTP fermé (plus de nouvelles requêtes acceptées).");
        
        try {
            // 2. On ferme le Worker BullMQ
            await articleWorker.close();
            console.log("⚙️ Worker BullMQ arrêté proprement.");

            // 3. On ferme proprement la connexion Redis
            await redis.quit();
            console.log("⚡ Connexion Redis fermée proprement.");

            // 4. On ferme proprement le pool MySQL
            await pool.end();
            console.log("🗄️ Pool de connexions MySQL fermé proprement.");
            
            // 4. Quand tout est propre, on quitte le processus Node.js avec le code 0 (Succès)
            process.exit(0);
        } catch (error) {
            console.error("❌ Erreur pendant la fermeture des connexions :", error);
            process.exit(1);
        }
    });
    
    // Sécurité supplémentaire : Forcer l'arrêt après 10 secondes
    setTimeout(() => {
        console.error("⏳ Délai dépassé. Arrêt forcé !");
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', shutdown);  
process.on('SIGTERM', shutdown);
