import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ============================================================================
 * AUTH GUARD (Le Videur à l'entrée)
 * ============================================================================
 * Dans une vraie architecture Frontend, on ne met pas la logique de protection
 * directement dans App.jsx. On crée des "Guards" (Gardiens).
 * 
 * L'AuthGuard vérifie si l'utilisateur est connecté (grâce au store Redux).
 * - S'il est connecté : Il le laisse passer vers la route demandée (<Outlet />).
 * - S'il n'est pas connecté : Il le redirige vers la page de login (<Navigate />).
 */
const AuthGuard = () => {
    // 💡 On lit le Garde-Manger (Redux) pour savoir si on est connecté
    const { isLogged } = useSelector((state) => state.auth);

    if (!isLogged) {
        // Redirection forcée vers la page de connexion
        return <Navigate to="/login" replace />;
    }

    // <Outlet /> est un composant spécial de React-Router.
    // Il signifie "Affiche les composants enfants qui sont à l'intérieur de cette route".
    // C'est comme dire "C'est bon, tu peux entrer dans la salle".
    return <Outlet />;
};

export default AuthGuard;
