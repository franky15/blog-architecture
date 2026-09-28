import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticlesThunk, deleteArticleThunk } from '../features/articleSlice';
import { fetchUserRoleThunk } from '../features/authSlice';

/**
 * ============================================================================
 * CUSTOM HOOK : useArticles (Le Cerveau du Dashboard)
 * ============================================================================
 * 🎓 CONCEPT SENIOR : SÉPARATION DES PRÉOCCUPATIONS (Separation of Concerns)
 * 
 * Pourquoi extraire cette logique hors de Dashboard.jsx ?
 * 1. Testabilité : On peut tester ce hook de manière isolée sans avoir à monter tout le HTML du composant React.
 * 2. Réutilisabilité : Si demain on crée une page "AdminArticles", on pourra réutiliser ce hook tel quel !
 * 3. Lisibilité (Clean Code) : Le fichier Dashboard.jsx redevient un composant "pur" d'affichage (UI).
 *    Il se contente de consommer les variables (articles, loading) sans se soucier de COMMENT on va les chercher.
 * 
 * 💡 Utilisation de useCallback : 
 * Les fonctions retournées (handlePageChange, handleDelete) sont "gelées" en mémoire. 
 * Cela évite qu'elles soient recréées à chaque rendu, ce qui casserait les React.memo de nos composants enfants.
 */
export const useArticles = (spaceId = 1) => {
    const dispatch = useDispatch();
    const [limit, setLimit] = useState(10);
    
    // Extraction des données du Garde-Manger (Redux)
    const { list: articles, pagination, loading, error } = useSelector((state) => state.articles);
    const { userRole, user } = useSelector((state) => state.auth);

    // Initialisation : Chargement du rôle et de la première page
    useEffect(() => {
        dispatch(fetchUserRoleThunk(spaceId));
        dispatch(fetchArticlesThunk({ page: pagination?.currentPage || 1, limit }));
    }, [dispatch, spaceId, limit, pagination?.currentPage]);

    // 🔄 Geler les fonctions avec useCallback (Pratique Senior)
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            dispatch(fetchArticlesThunk({ page: newPage, limit }));
        }
    }, [dispatch, limit, pagination.totalPages]);

    const handleLimitChange = useCallback((e) => {
        const newLimit = parseInt(e.target.value, 10);
        setLimit(newLimit);
        // Retour automatique à la page 1 pour éviter les "pages fantômes"
        dispatch(fetchArticlesThunk({ page: 1, limit: newLimit }));
    }, [dispatch]);

    const handleDelete = useCallback(async (id) => {
        if (window.confirm("Es-tu sûr de vouloir supprimer cet article ?")) {
            try {
                await dispatch(deleteArticleThunk(id)).unwrap();
            } catch (err) {
                console.error("Erreur de suppression:", err);
                alert(err);
            }
        }
    }, [dispatch]);

    // On retourne uniquement ce dont la vue (le HTML) a besoin
    return {
        articles,
        pagination,
        loading,
        error,
        userRole,
        user,
        limit,
        handlePageChange,
        handleLimitChange,
        handleDelete
    };
};
