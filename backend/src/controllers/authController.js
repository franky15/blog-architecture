// src/controllers/authController.js
// 📘 POURQUOI CE FICHIER ?
// C'est le Controller. Il contient toute la "Logique Métier" (Business Logic) de l'authentification.
// Les routes se contentent d'appeler ces fonctions.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Notre piscine de connexions MySQL

// 1. INSCRIPTION (Register)
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation basique
        if (!email || !password) {
            return res.status(400).json({ error: "L'email et le mot de passe sont obligatoires." });
        }

        // Vérifier si l'utilisateur existe déjà
        // 🚨 PREPARED STATEMENT (?) obligatoire pour éviter l'Injection SQL !
        const [existingUsers] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: "Cet email est déjà utilisé." }); // 409 Conflict
        }

        // Hachage du mot de passe
        // On ne sauvegarde JAMAIS un mot de passe en clair. '10' est le "salt rounds" (la complexité).
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertion dans la base de données
        const [result] = await pool.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        res.status(201).json({
            message: "Utilisateur créé avec succès !",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

// 2. CONNEXION (Login)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "L'email et le mot de passe sont obligatoires." });
        }

        // Récupérer l'utilisateur depuis MySQL
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." }); // 401 Unauthorized
        }

        const user = users[0];

        // Vérifier que le mot de passe correspond au hash en BDD
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        // Générer le Token JWT (Badge d'accès virtuel)
        // On y glisse l'ID de l'utilisateur. Le token expirera dans 24 heures.
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Connexion réussie !",
            token: token,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

module.exports = {
    register,
    login
};
