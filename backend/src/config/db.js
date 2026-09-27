// src/config/db.js
// 📘 POURQUOI CE FICHIER ?
// Ce fichier centralise la connexion à notre base de données MySQL. 
// Nous utilisons un "Pool" de connexions plutôt qu'une connexion unique pour des raisons de performance.

const mysql = require('mysql2/promise'); // On utilise mysql2/promise pour bénéficier de async/await

// 🚨 PIÈGE À ÉVITER : Ne jamais mettre les mots de passe en clair dans le code. 
// On utilise toujours des variables d'environnement (process.env).
require('dotenv').config();

// Création du Pool de connexion 
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blog_db',
    waitForConnections: true, // Si la limite est atteinte, les requêtes patientent
    connectionLimit: 10,      // Maximum 10 connexions ouvertes en même temps
    queueLimit: 0             // Pas de limite sur le nombre de requêtes en attente
});

// 💡 ASTUCE DE SENIOR : On teste la connexion immédiatement au démarrage.
// Si la BDD est inaccessible, on veut que notre serveur crash tout de suite (Fail Fast) 
// plutôt que de découvrir le bug lors de la première requête utilisateur.
async function testConnection() {
    try {
        const connection = await pool.getConnection(); // On "emprunte" une connexion au pool
        console.log("✅ Connecté avec succès à la base de données MySQL !");
        connection.release(); // IMPORTANT : On remet la connexion dans la piscine !
    } catch (error) {
        console.error("❌ Erreur de connexion à la base de données :", error.message);
        // On arrête brutalement le processus Node.js car sans base de données, l'API ne sert à rien.
        process.exit(1);
    }
}

testConnection();

module.exports = pool;
