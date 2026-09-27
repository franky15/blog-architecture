// src/services/unsplashService.js
// 📘 POURQUOI CE FICHIER ?
// C'est un Service. Son rôle unique est d'interagir avec le monde extérieur (ici, l'API d'Unsplash).
// Il applique le pattern "Data Mapper" : il va chercher les données brutes chez Unsplash 
// et les nettoie (filtre) pour ne renvoyer que ce dont notre application a besoin.

const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

// JSDoc (Documentation): 
// * Autocomplétion intelligente (IntelliSense) : Quand tu écriras unsplashService.searchPhotos(, 
// ton éditeur affichera une bulle d'aide te disant "Attentions, queryTerm doit être du texte (ex: 'nature'), perPage un nombre".
// * Génération de doc : Des outils automatisés peuvent lire ces blocs pour générer un site de documentation complet pour ton projet. 
/**
 * Recherche des photos sur Unsplash en fonction d'un mot-clé
 * @param {string} queryTerm - Le mot-clé de recherche (ex: 'nature', 'technology')
 * @param {number} perPage - Le nombre de résultats souhaité (défaut: 10)
 * @returns {Promise<Array>} Tableau d'images simplifiées
 */
const searchPhotos = async (queryTerm, perPage = 10) => {
    // 1. Vérification de sécurité : La clé d'API doit être chargée depuis le fichier .env
    /**
     * throw permet de stopper l'execution et de retourner une erreur. au prochain try/catch rencontré,le throw sera intercepté et le catch sera executé
     * ce try catch la sera celui du controller qui est le parent du service cela permet aussi d'eviter d'imbriquer les try catch l'un dans l'autre
     * ceci throw new Error permet de retourner l'erreurs avec tous les informations necessaire a la resolution on aurait pu envoyer par exemple
     * throw "Erreur d'authentification";           // ✅ Une simple chaîne
     * throw 404;                                  // ✅ Un nombre
     * throw { code: 500, message: "Base HS" };     // ✅ Un objet classique

     */
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
        throw new Error("La clé UNSPLASH_ACCESS_KEY est manquante dans les variables d'environnement (.env).");
    }

    // 2. Construction de l'URL sécurisée (encodeURIComponent évite les bugs si le mot clé contient des espaces)
    const url = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(queryTerm)}&per_page=${perPage}`;

    // 3. Appel de l'API externe avec le Header Authorization au format Client-ID imposé par Unsplash
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Client-ID ${apiKey}`,
            'Accept-Version': 'v1'
        }
    });

    // 4. Gestion des erreurs HTTP de l'API externe (ex: Quota dépassé 429, Clé invalide 401)
    //pareil ici pour le throw et accompagne de new Error
    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Erreur API Unsplash (Statut ${response.status}) : ${errorDetails}`);
    }

    // 5. Extraction du JSON de réponse envoyé par Unsplash
    const data = await response.json();

    // 6. MAPPER / FILTRAGE : Unsplash renvoie un objet énorme (des dizaines de champs inutiles).
    // Nous ne gardons QUE ce qui est utile pour notre frontend (Pattern Backend-For-Frontend).
    const cleanedPhotos = data.results.map(photo => ({
        id: photo.id,
        description: photo.alt_description || photo.description || 'Image Unsplash',
        url_small: photo.urls.small,
        url_regular: photo.urls.regular,
        photographer: photo.user.name,
        photographer_url: photo.user.links.html
    }));

    return cleanedPhotos;
};

module.exports = {
    searchPhotos
};
