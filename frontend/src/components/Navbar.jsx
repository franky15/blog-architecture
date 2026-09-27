import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';

const Navbar = () => {
    // On lit le Garde-Manger (Redux) pour savoir si on est connecté et qui on est
    const { isLogged, user, userRole } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        // On dispatche l'action synchrone de déconnexion (qui va vider le store et le localStorage)
        dispatch(logout());
        // On redirige vers la page de connexion
        navigate('/login');
    };

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div>
                <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    SuperBlog 🚀
                </Link>
            </div>

            {/* Menu affiché uniquement si l'utilisateur est connecté */}
            {isLogged && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link 
                        to="/" 
                        style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}
                    >
                        Tableau de bord
                    </Link>
                    {userRole !== 'Reader' && (
                        <Link 
                            to="/create-article" 
                            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}
                        >
                            + Nouvel Article
                        </Link>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
                        <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>
                            Hello, <strong style={{ opacity: 1 }}>{user?.username || 'Utilisateur'}</strong>
                        </span>
                        <button 
                            onClick={handleLogout}
                            style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#ef4444';
                                e.target.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#ef4444';
                            }}
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            )}
            
            {/* S'il n'est pas connecté et n'est pas sur la page login (optionnel mais propre) */}
            {!isLogged && (
                <div>
                    <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                        Se connecter
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
