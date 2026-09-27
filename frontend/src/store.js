import { configureStore } from '@reduxjs/toolkit';

/**
 * 💡 EXPLICATION IMPORT DEFAULT vs EXPORT CONST
 * Dans authSlice.js et articleSlice.js, on exporte le reducer avec "export default".
 * Un "export default" n'a pas de nom strict. Celui qui importe a le droit de choisir le nom qu'il veut !
 * C'est pour ça qu'on a le droit d'importer "authSlice.reducer" sous le nom "authReducer" ici. 
 * Ça rend le code plus lisible (on sait exactement ce qu'on manipule).
 */
import authReducer from './features/authSlice';
import articleReducer from './features/articleSlice';

// 👇 ICI C'EST LA CUISINE CENTRALE (Le Store)
// On rassemble toutes les stations de travail (Slices) pour avoir un seul grand garde-manger global.
export const store = configureStore({
    reducer: {
        auth: authReducer,       // La station d'authentification
        articles: articleReducer // La station des articles
    }
});
