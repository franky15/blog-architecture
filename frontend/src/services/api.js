import axios from 'axios';

// On crée une instance configurée
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // L'URL de notre Backend Express
});

// Intercepteur : Avant même que la requête ne parte vers le backend, Axios l'intercepte. 
// Dans le but d'insérer le token dans le header de la requête, pour que le backend puisse l'authentifier.
api.interceptors.request.use((config) => {
    // 💡 localStorage est 100% SYNCHRONE (très rapide). Il lit directement sur le disque dur du navigateur.
    const token = localStorage.getItem('token');
    
    // Si on a un jeton, on le glisse automatiquement dans le "sac à dos" (Headers) de la requête ! 
    // ça donnera Authorization: `Bearer ${token}` dans le Header de la requête qui va vers le backend.
    // C'est grâce à cela que l'authentification se fera dans le backend.
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // On libère la requête, qui peut maintenant partir vers le serveur Express.
    return config;
});

export default api;
