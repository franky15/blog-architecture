// src/controllers/imageController.js
// 📘 POURQUOI CE FICHIER ?
// C'est le Contrôleur pour la gestion des images. 
// Il écoute les requêtes des utilisateurs (ex: GET /api/images/search?query=nature),
// appelle le Service Unsplash, et renvoie la réponse au client (Postman ou React).

const unsplashService = require('../services/unsplashService');

/**
 * Endpoint de recherche d'imagesUnsplash via notre backend (Proxy)
 * Route : GET /api/images/search?query=mot_cle
 */
const searchImages = async (req, res) => {
    try {
        // 1. Récupération du terme de recherche depuis la Query String de l'URL (?query=...)
        const { query } = req.query;

        // 2. Validation : On vérifie que l'utilisateur a bien fourni un terme de recherche
        if (!query || query.trim() === '') {
            return res.status(400).json({ 
                error: "Le paramètre de recherche 'query' est obligatoire (ex: /api/images/search?query=nature)." 
            });
        }

        // 3. Appel du service (notre pont vers l'API externe Unsplash)
        const images = await unsplashService.searchPhotos(query);

        // 4. Envoi de la réponse filtrée et propre au client
        res.status(200).json({
            count: images.length,
            results: images
        });

    } catch (error) {
        console.error("Erreur dans imageController.searchImages :", error.message);
        res.status(500).json({ 
            error: "Impossible de récupérer les images depuis le service externe.",
            details: error.message
        });
    }
};

module.exports = {
    searchImages
};
