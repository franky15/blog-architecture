import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

/**
 * ============================================================================
 * ARTICLE SLICE (Le Cuisinier en charge des Articles)
 * ============================================================================
 * Ce fichier gère l'état global (Redux) de tous les articles.
 * Tout comme dans AuthSlice, on sépare la logique Asynchrone (Le Thunk) 
 * de la logique Synchrone (Le Reducer).
 */

// 👇 LE THUNK (Le Livreur Asynchrone) RECUPERATION DE TOUS LES ARTICLES
// Par convention, on ajoute le suffixe "Thunk" pour bien le différencier d'une simple action.
// Ce Thunk est chargé d'aller chercher la liste des articles sur le Backend Express.
//a noter ici le _ signifie que nous n'avons pas besoin du premier argument du thunk (qui est le payload) à envoyer 
//au backend ATTENTION il est different du payload envoyé au extraReducers plus bas car lui c'est le payload de la reponse du thunk
//ce payload aurait été nécessaire si nous avions besoin de passer un id ou autre chose a notre fonction
export const fetchArticlesThunk = createAsyncThunk(
    'articles/fetchAll', // Le nom officiel de la mission
    
    // 🧐 EXPLICATION DE LA SYNTAXE "{ page = 1, limit = 10 } = {}" :
    // 1. Le = {} à la fin signifie : "Si le développeur oublie de passer un paramètre lors de l'appel (ex: dispatch(fetchArticlesThunk())), 
    //    alors considère que l'argument est un objet vide par défaut, pour que ça ne crashe pas."
    // 2. Le { page = 1, limit = 10 } à gauche (Destructuration) signifie : "Prends cet objet, et extrait-en 'page' et 'limit'. 
    //    S'ils ne sont pas précisés, donne-leur la valeur 1 et 10."
    async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            // 🛣️ Trajet 1 : Le Livreur part (GET vers /spaces/1/articles?page=x&limit=y)
            const response = await api.get(`/spaces/1/articles?page=${page}&limit=${limit}`);

            // 🛣️ Trajet 2 : Le Backend a répondu avec { data: [...], pagination: {...} }
            // On retourne tout l'objet pour que le reducer puisse séparer les articles et la pagination
            return response.data;
        } catch (error) {
            // Si le backend renvoie une erreur (ex: 401 Non Autorisé, 500 Erreur serveur)
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des articles');
        }
    }
);
// 👇 NOUVEAU THUNK : RÉCUPÉRER UN SEUL ARTICLE (GET)
// Ici, le premier argument n'est pas `_`, c'est `id` ! 
// C'est le payload que le composant React (Frontend) envoie au Thunk lors du dispatch. ex: dispatch(fetchSingleArticleThunk(5))
export const fetchSingleArticleThunk = createAsyncThunk(
    'articles/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/spaces/1/articles/${id}`);
            return response.data; // Renvoie l'objet article complet
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Article introuvable');
        }
    }
);

// 👇 NOUVEAU THUNK : CRÉER UN ARTICLE (POST)
// Ici le premier argument `articleData` contiendra les informations tapées dans le formulaire (Titre, Contenu, Image...)
export const createArticleThunk = createAsyncThunk(
    'articles/create',
    async (articleData, { rejectWithValue }) => {
        try {
            // Note : Si 'articleData' est de type FormData (pour les images), 
            // Axios va automatiquement configurer le header en 'multipart/form-data'. Magique !
            const response = await api.post('/spaces/1/articles', articleData);
            return response.data; // Renvoie l'article nouvellement créé par le backend
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
        }
    }
);

// 👇 NOUVEAU THUNK : METTRE À JOUR UN ARTICLE (PUT)
// Attention, un Thunk ne peut accepter QU'UN SEUL argument métier. 
// Si on veut envoyer un `id` ET des `données`, on doit les grouper dans un objet { id, articleData }.
export const updateArticleThunk = createAsyncThunk(
    'articles/update',
    async ({ id, articleData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/spaces/1/articles/${id}`, articleData);
            return response.data; // L'article mis à jour
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    }
);

// 👇 NOUVEAU THUNK : SUPPRIMER UN ARTICLE (DELETE)
export const deleteArticleThunk = createAsyncThunk(
    'articles/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/spaces/1/articles/${id}`);
            // On retourne l'ID de l'article supprimé. 
            // Pourquoi ? Pour que le Reducer (en bas) sache quel article retirer de la liste (list) dans le state !
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    }
);

// 👇 LE SLICE (Le Garde-Manger et ses Cuisiniers)
const articleSlice = createSlice({
    name: 'articles',

    // L'état initial du Garde-Manger pour les articles.
    // 'list' contiendra le tableau des articles. 'loading' permet d'afficher un spinner.
    // 'singleArticle' contiendra l'article demandé lorsqu'on clique dessus.
    initialState: {
        list: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
        singleArticle: null,
        loading: false,
        error: null
    },

    // Les reducers synchrones (ex: vider la liste si on se déconnecte)
    reducers: {
        clearArticles: (state) => {
            state.list = [];
            state.singleArticle = null;
        }
    },

    // 👇 EXTRA REDUCERS (La Réception de la commande Asynchrone)
    // C'est ici que l'on écoute le retour du `fetchArticlesThunk`.
    extraReducers: (builder) => {
        builder
            // ================== FETCH ALL ==================
            // ⏳ Cas 1 : PENDING (La requête API est partie, on attend)
            // C'est généré automatiquement par createAsyncThunk.
            .addCase(fetchArticlesThunk.pending, (state) => {
                state.loading = true; // On indique au frontend d'afficher un chargement
                state.error = null;
            })
            // ✅ Cas 2 : FULFILLED (La requête a réussi, on a les articles)
            .addCase(fetchArticlesThunk.fulfilled, (state, action) => {
                state.loading = false;
                // action.payload contient { data, pagination }
                state.list = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            // ❌ Cas 3 : REJECTED (La requête a échoué)
            .addCase(fetchArticlesThunk.rejected, (state, action) => {
                state.loading = false;
                // On stocke le message d'erreur pour l'afficher à l'utilisateur
                state.error = action.payload;
            })
            // ================== FETCH SINGLE ==================
            .addCase(fetchSingleArticleThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSingleArticleThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.singleArticle = action.payload; // On stocke le seul article demandé
            })
            .addCase(fetchSingleArticleThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // ================== CREATE ==================
            .addCase(createArticleThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createArticleThunk.fulfilled, (state, action) => {
                state.loading = false;
                // ASTUCE SENIOR : Au lieu de refaire une requête au backend pour récupérer toute la liste,
                // on ajoute directement le nouvel article (action.payload) en tête de notre liste existante !
                state.list.unshift(action.payload);
            })
            .addCase(createArticleThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // ================== UPDATE ==================
            .addCase(updateArticleThunk.fulfilled, (state, action) => {
                // On cherche l'article modifié dans notre liste et on le remplace
                const index = state.list.findIndex(article => article.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
                // Si on était en train de l'afficher en solo, on le met aussi à jour !
                if (state.singleArticle?.id === action.payload.id) {
                    state.singleArticle = action.payload;
                }
            })
            // ================== DELETE ==================
            .addCase(deleteArticleThunk.fulfilled, (state, action) => {
                // action.payload contient l'ID renvoyé par le thunk.
                // On filtre notre liste pour retirer l'article qui a cet ID !
                state.list = state.list.filter(article => article.id !== action.payload);
            });
    }
});

// On exporte les Action Creators synchrones
//attention on exporte avec les accolades ce qui veut dire qu'on ne peut pas renommer 
//la fonction quand on l'importe dans un autre fichier.
//Dans le fichier article.jsx on importe clearArticles avec les accolades ce qui veut dire qu'on ne peut pas le renommer
export const { clearArticles } = articleSlice.actions;

// On exporte le Chef de Partie pour l'ajouter à la Cuisine Centrale (store.js)
// Par contre on peut renommer le reducer car on l'export avec export default
//c'est pour cela que dans le store.js on importe avec articleReducer
export default articleSlice.reducer;
