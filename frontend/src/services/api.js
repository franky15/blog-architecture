import axios from 'axios';
import { store } from '../store';
import { logout } from '../features/authSlice';

// On crée une instance configurée
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // L'URL de notre Backend Express
});

/**
 * ============================================================================
 * INTERCEPTEUR DE REQUÊTE (Request Interceptor)
 * ============================================================================
 * 💡 Rôle : Ajouter le Token dans chaque requête sortante qui va vers le backend
 * Car le token est stocké dans localStorage et n'est pas transmis automatiquement 
 * a chaque requete
 */
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

/**
 * ============================================================================
 * 🎓 PATTERN SENIOR : L'INTERCEPTEUR DE RÉPONSE (Response Interceptor)
 * ============================================================================
 */
api.interceptors.response.use(
    (response) => {
        // Axios arrive ici SEULEMENT SI le backend répond avec un code HTTP 2xx (Succès).
        // Il n'y a pas besoin de condition 'if', car le simple fait d'être dans cette première fonction
        // signifie "Tout s'est bien passé".
        return response;
    },
    (error) => {
        // Axios bascule AUTOMATIQUEMENT ici si le backend répond avec un code d'erreur (4xx, 5xx).
        // La condition if ci-dessous sert juste à vérifier si l'erreur est bien une erreur 401 (et pas une 500 par exemple).
        if (error.response && error.response.status === 401) {
            console.warn("🚨 Sécurité : Token expiré ou invalide. Déconnexion automatique.");

            // 🎓 APPROCHE ULTRA-SENIOR : 
            // On importe directement le "store" de Redux et l'action "logout" en haut de ce fichier.
            // On ordonne au store de vider le Redux State et le localStorage proprement !
            store.dispatch(logout());

            // 💡 Redirection : On ne peut pas utiliser useNavigate() ici car on est hors d'un composant React.
            // Utiliser window.location.href est 100% propre et standard hors contexte React. 
            // L'avantage de window.location.href, c'est qu'il force le navigateur à vider toute sa mémoire RAM
            // (les états React, etc.) et à recharger l'application de zéro. C'est le plus sécurisé pour un logout.
            window.location.href = '/login';
        }

        // On retourne l'erreur pour que le Thunk puisse la traiter s'il le veut
        return Promise.reject(error);
    }
);

export default api;
