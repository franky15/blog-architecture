import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';


/*
RESUME DE TOUT CE QUI SE PASSE ENTRE LE THUNK ET LE REDUCER
Un Thunk (qui est asynchrone) n'a absolument pas le droit de modifier le Store (le Garde-Manger).
Seul le Reducer (le Cuisinier), qui est 100% synchrone, détient cette clé.
Le Thunk fait son travail d'API à l'extérieur, puis crée une Action (un bon de commande) 
qu'il glisse sous la porte de la cuisine, et c'est le extraReducers qui l'attrape.

Voici les réponses précises à tes questions (que je viens d'ailleurs d'ajouter dans 
le fichier pedagogie_frontend.md à la ligne 96 car c'est une connaissance Senior inestimable !) :

1. D'où viennent pending, fulfilled, et rejected ? Est-ce que ça vient de .unwrap() ? 
Non, ça ne vient pas de .unwrap(). Ces 3 états sont créés magiquement et automatiquement 
par createAsyncThunk. Dès que tu fais dispatch(loginUserThunk()), voici ce qui se passe 
sous le capot :

🛫 Immédiatement : Redux crée tout seul une Action nommée auth/loginUser/pending et 
l'envoie au Reducer (pour qu'on affiche un "chargement en cours...").
✅ Si Axios réussit : Redux crée tout seul l'Action auth/loginUser/fulfilled (avec la donnée dans le payload) et l'envoie au Reducer.
❌ Si Axios échoue (ex: Erreur 401 captée par rejectWithValue) : Redux crée l'Action auth/loginUser/rejected (avec l'erreur en payload) et l'envoie au Reducer.

Pourquoi on utilise extraReducers et pas reducers pour le Thunk ? Tu l'as dit : parce que c'est asynchrone !

Les reducers classiques (comme logout) fabriquent eux-mêmes leurs propres Action Creators synchrones.
Mais pour un Thunk, l'Action Creator (loginUserThunk) est déjà créé à l'extérieur par createAsyncThunk.
Le Reducer ne l'a pas créé, il ne fait que "l'écouter" de l'extérieur. D'où le terme extraReducers (Réducteurs Supplémentaires).
*/


// 👇 LE THUNK (Le Livreur Asynchrone)
// Il part avec l'email et le password, fait la requête au backend, et revient avec la donnée.
/*ATTENTION  La connexion est toujours asynchone d'ou on a fait la connexion en thunk car c'est une action asynchrone qui fait appel a une API  
ce qui fait que on ne peut pas faire un reducer ou slice  on va donc juste utiliser ses resultats dans le slice AuthSlice
car un reducer est synchrone et ne peut pas faire appel a une API d'ou on fait la deconnecxion dans le slice authSlice
*/
export const loginUserThunk = createAsyncThunk(
    'auth/loginUser', // Le nom officiel de la mission du livreur (nom du thunk)
    async (credentials, { rejectWithValue }) => {
        try {
            // 🛣️ Trajet 1 : On envoie la donnée au Backend (Axios fait un POST vers Express) la donnee est Credentials 
            // credentials est l'objet contenant email et password, c'est le payload
            // rejectWithValue est une fonction qui permet de retourner une erreur du coté du frontend
            const response = await api.post('/auth/login', credentials);

            // 🛣️ Trajet 2 (Partie 1) : Le Backend a répondu ! On sauvegarde le token immédiatement.
            // response.data est ce que le backend nous renvoie 
            // localStorage est une API web qui permet de stocker des données dans le navigateur de l'utilisateur
            localStorage.setItem('token', response.data.token);

            // 🛣️ Trajet 2 (Partie 2) : On retourne la donnée.
            // Ce `return` devient automatiquement le "action.payload" que le Reducer va recevoir.
            return response.data.user;
        } catch (error) {
            // Si le backend répond avec une erreur (ex: 401 Mauvais mot de passe)
            return rejectWithValue(error.response?.data?.message || 'Erreur de connexion');
        }
    }
);

// 👇 NOUVEAU THUNK : RÉCUPÉRER LE RÔLE DANS L'ESPACE
export const fetchUserRoleThunk = createAsyncThunk(
    'auth/fetchRole',
    async (spaceId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/spaces/${spaceId}/role`);
            return response.data.role; // ex: 'Admin'
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Erreur rôle');
        }
    }
);

// slice  est synchrone et ne peut pas faire appel a une API de ce fait on fait appel au thunk qui est asynchrone dans le 
// extraReducers qui gere la partie assynchrone le thunk
//ATTENTION le thunk et le slice fonctionne ensemble ce qui fait que quand le thunk est execute
//automatiquement sa donnee est transmise dans le extraReducers  le payload pour l'action et les statuts
//fullfilled, rejected, pending est creer par le createAsyncThunk automatiquement
//a noter rejected est transmis grace a rejectWithValue du thunk au extraReducers 
const authSlice = createSlice({
    name: 'auth',
    // On ajoute `loading` et `error` au Garde-Manger pour pouvoir afficher un spinner de chargement et des messages d'erreur !
    // 💡 IMPORTANT : On vérifie si un token existe dans le localStorage au démarrage pour garder l'utilisateur connecté après un rafraîchissement !
    initialState: { 
        user: null, 
        userRole: null, // Nouveau: le rôle dans l'espace courant (Admin, Contributor, Reader)
        
        // 🧐 EXPLICATION DE LA SYNTAXE "!!" (Double Bang) :
        // localStorage.getItem('token') renvoie soit une String (le token), soit null (s'il n'y a rien).
        // Or, on veut que isLogged soit un Booléen (true ou false) pour que l'AuthGuard fonctionne bien.
        // - Le premier "!" transforme la String en false, et null en true (inverse logique).
        // - Le deuxième "!" inverse à nouveau : la String devient true, null devient false.
        // C'est une astuce de Senior pour convertir très rapidement n'importe quelle valeur en un vrai Booléen !
        isLogged: !!localStorage.getItem('token'), 
        
        loading: false, 
        error: null 
    },

    // 👇 REDUCERS SYNCHRONES (Pour les actions immédiates, comme se déconnecter)
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token'); // On détruit le token
            state.user = null; // On vide le garde-manger
            state.isLogged = false;
            state.error = null;
        }
    },

    // 👇 EXTRA REDUCERS (Pour écouter notre Livreur Asynchrone / Le Thunk)
    // C'est ici que les Cuisiniers attendent le retour du Thunk pour mettre à jour le Garde-Manger.
    extraReducers: (builder) => {
        builder
            // ⏳ Cas 1 : Le Livreur est en route (la requête API est en cours)
            .addCase(loginUserThunk.pending, (state) => {
                state.loading = true;
                state.error = null; // On efface les anciennes erreurs
            })
            // ✅ Cas 2 : Le Livreur est revenu avec succès
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.isLogged = true;
                // Le cuisinier prend la donnée retournée par le Thunk (action.payload) et la stocke.
                state.user = action.payload;
            })
            // ❌ Cas 3 : Le Livreur est revenu bredouille (Erreur 401, 500...)
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // On stocke le message d'erreur pour l'afficher à l'utilisateur
            })
            // --- GESTION DU ROLE ---
            .addCase(fetchUserRoleThunk.fulfilled, (state, action) => {
                state.userRole = action.payload;
            });
    }
});

// On n'exporte QUE logout ici, car la fonction de login est maintenant gérée par notre Thunk `loginUser` !
//Attention lorsqu'on export avec les accolades cela signifie que on ne peut pas renommer le nom de la fonction 
//quand on l'important dans un autre fichier. En effet dans le fichier login.jsx on importe logout avec les accolades 
//ce qui veut dire qu'on ne peut pas le renommer
export const { logout } = authSlice.actions;

// On exporte le chef de partie global (Reducer)
//Par contre on peut renommer le reducer car on l'export avec export default
//c'est pour cela que dans le store.js on importe avec authReducer
export default authSlice.reducer;
