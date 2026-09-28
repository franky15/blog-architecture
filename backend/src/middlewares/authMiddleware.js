// src/middlewares/authMiddleware.js
// 📘 POURQUOI CE FICHIER ?
// C'est notre "Videur de boîte de nuit" (Middleware).
// Il intercepte les requêtes HTTP AVANT qu'elles n'atteignent le Controller.
// Son but : Vérifier si l'utilisateur possède un Token JWT valide. S'il n'en a pas, il le rejette.

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. On regarde si le client a envoyé le Token dans l'en-tête (Header) "Authorization"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized : "Vous n'avez pas de badge d'accès"
        return res.status(401).json({ error: "Accès refusé. Token manquant ou invalide." });
    }

    // Le token ressemble à "Bearer eyJhbGciOiJIUzI1...", on veut juste la deuxième partie (le token pur)
    const token = authHeader.split(' ')[1];

    try {
        // 2. On décode et vérifie le token avec notre clé secrète
        // 💡 La librairie jsonwebtoken vérifie AUTOMATIQUEMENT la date d'expiration (le champ 'exp').
        // Si le token est expiré, jwt.verify() lève une exception "TokenExpiredError" !
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. DÉCORATION D'OBJET (Injection)
        req.user = decoded;

        // 4. On laisse passer la requête vers la suite (le Controller)
        next();

    } catch (error) {
        // 🚨 IMPORTANT : On utilise 401 (Unauthorized) et non 403 (Forbidden) pour une erreur d'authentification.
        // Cela permet à notre intercepteur Axios (Frontend) de capter ce 401 et de déconnecter l'utilisateur.
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
};

module.exports = authMiddleware;
