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
        // Si le token est faux ou expiré, ça "crashe" et on part direct dans le "catch".
        // S'il est valide, jwt.verify() retourne un Objet JSON exact à ce qu'on a signé dans le Controller.
        // Exemple de ce que contient 'decoded' : { "id": 1, "iat": 1695420000, "exp": 1695506400 }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. DÉCORATION D'OBJET (Injection)
        // En JavaScript, les objets sont flexibles. L'objet 'req' (la requête) n'a nativement pas de case 'user'.
        // On crée dynamiquement cette propriété `req.user` et on y glisse notre objet 'decoded'.
        // Comme le Middleware et le Controller se passent le MÊME objet 'req' en mémoire de main en main,
        // le Controller pourra lire `req.user.id` pour savoir "qui" fait l'action !
        req.user = decoded;

        // 4. On laisse passer la requête vers la suite (le Controller)
        next();

    } catch (error) {
        // Si jwt.verify() plante, on rejette le client (403 Forbidden : Token invalide/expiré)
        return res.status(403).json({ error: "Token invalide ou expiré." });
    }
};

module.exports = authMiddleware;
