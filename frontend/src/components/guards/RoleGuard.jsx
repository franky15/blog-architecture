import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ============================================================================
 * LE VIDEUR DES ROLES (RoleGuard)
 * ============================================================================
 * Il se place devant les pages sensibles (ex: CreateArticle, EditArticle).
 * Il vérifie le rôle de l'utilisateur (Admin, Contributor, Reader).
 * S'il n'a pas le bon rôle, il le renvoie au Dashboard avec un avertissement.
 */
const RoleGuard = ({ allowedRoles }) => {
    // On demande au Garde-Manger (Redux) le rôle actuel de l'utilisateur
    const { userRole, loading } = useSelector((state) => state.auth);

    // Si on est en train de charger le rôle, on peut afficher un petit texte
    if (loading) {
        return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Vérification des accès... 🔒</p>;
    }

    // Si le rôle de l'utilisateur n'est pas dans le tableau des rôles autorisés (ex: ['Admin', 'Contributor'])
    if (!allowedRoles.includes(userRole)) {
        // Redirection vers le tableau de bord (accès refusé)
        return <Navigate to="/" replace />;
    }

    // Si le rôle est bon, on laisse passer au composant enfant (<Outlet />)
    return <Outlet />;
};

export default RoleGuard;
