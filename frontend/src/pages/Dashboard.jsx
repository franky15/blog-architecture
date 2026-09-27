import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchArticlesThunk, deleteArticleThunk } from '../features/articleSlice';
import { fetchUserRoleThunk } from '../features/authSlice';

/**
 * ============================================================================
 * PAGE DASHBOARD (Le Maître d'Hôtel)
 * ============================================================================
 * C'est un composant "Smart". Son rôle n'est pas juste d'afficher du HTML, 
 * mais d'orchestrer la donnée : il ordonne à Redux d'aller chercher les articles, 
 * puis il les lit depuis Redux pour les afficher.
 */
const Dashboard = () => {
    // 💡 1. Les Outils
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 💡 Fonction pour gérer la suppression (Trajet 1)
    const handleDelete = async (id) => {
        if (window.confirm("Es-tu sûr de vouloir supprimer cet article ?")) {
            try {
                // On lance le Thunk de suppression. Si ça réussit, le Reducer retirera l'article de la liste !
                await dispatch(deleteArticleThunk(id)).unwrap();
            } catch (err) {
                console.error("Erreur de suppression:", err);
                alert(err);
            }
        }
    };

    // 💡 2. Lecture du Garde-Manger (Trajet 2)
    // On extrait les informations du state global "articles" (défini dans store.js)
    const { list: articles, pagination, loading, error } = useSelector((state) => state.articles);
    // On prend aussi les infos de l'utilisateur et son rôle pour lui dire bonjour et afficher/masquer des boutons
    const { user, userRole } = useSelector((state) => state.auth);

    // 💡 3. Déclenchement à l'affichage (Trajet 1)
    // ==========================================
    // EXPLICATION DE useEffect ET [dispatch] :
    // 
    // 1. Quand s'exécute-t-il ?
    // Il s'exécute UNE SEULE FOIS quand le composant apparaît à l'écran (au "montage").
    //
    // 2. Pourquoi [dispatch] à la fin ?
    // C'est le "Tableau de dépendances". Il dit à React : "Ne réexécute ce useEffect QUE si la variable 'dispatch' change en mémoire".
    // Or, la fonction 'dispatch' de Redux est STABLE : elle ne change JAMAIS de toute la vie de l'application !
    // Donc, mettre [dispatch] revient au même que de mettre [] : ça ne s'exécutera qu'une seule fois.
    // On le met par pure bonne pratique, car le Linter React exige qu'on déclare toutes les variables externes utilisées dans le useEffect.
    //
    // 3. Est-ce que ça capte les autres dispatch de l'application ?
    // NON ! Le tableau [dispatch] n'est pas un "écouteur d'évènements". Il ne se déclenche pas quand on fait une action. 
    // Il vérifie uniquement si la *définition de la fonction dispatch* a été modifiée, ce qui n'arrive jamais.
    //
    // 4. Pourquoi pas de boucle infinie ?
    // - Le useEffect s'exécute à l'arrivée.
    // - Il fait dispatch(fetchArticlesThunk()).
    // - Le backend répond, le Reducer met à jour le Store.
    // - useSelector voit le changement et demande à React de redessiner le composant (re-render).
    // - React redessine le composant, arrive sur le useEffect et se demande : "Est-ce que 'dispatch' a changé ?" -> NON.
    // - React NE RELANCE PAS le useEffect. Fin de l'histoire, pas de boucle infinie !
    // État local pour gérer la limite d'articles par page
    const [limit, setLimit] = useState(10);

    // ==========================================
    useEffect(() => {
        // On récupère le rôle de l'utilisateur pour cet espace (Espace 1)
        dispatch(fetchUserRoleThunk(1));

        // On utilise la pagination locale pour charger la bonne page et la bonne limite
        dispatch(fetchArticlesThunk({ page: pagination?.currentPage || 1, limit }));
    }, [dispatch, pagination?.currentPage, limit]);

    // Fonction pour changer de page
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            dispatch(fetchArticlesThunk({ page: newPage, limit }));
        }
    };

    // Fonction pour changer la limite
    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value, 10);
        setLimit(newLimit);
        // Quand on change la limite, on retourne toujours à la page 1 pour éviter les bugs de pages fantômes
        dispatch(fetchArticlesThunk({ page: 1, limit: newLimit }));
    };

    return (
        <div className="app-container" style={{ padding: '2rem' }}>
            <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1>Tableau de bord 📝</h1>
                    <p style={{ color: '#a8b2d1', marginBottom: '1.5rem' }}>Bienvenue <strong>{user?.username}</strong>. Voici tes articles :</p>

                    {/* Caché si l'utilisateur est uniquement Reader */}
                    {userRole !== 'Reader' && (
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/create-article')}
                        >
                            + Rédiger un nouvel article
                        </button>
                    )}
                </header>

                {/* ⏳ Gestion des états de chargement et d'erreur venant de Redux */}
                {loading && <p style={{ textAlign: 'center' }}>Chargement des articles en cours... ⏳</p>}

                {error && (
                    <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px' }}>
                        Erreur : {error}
                    </div>
                )}

                {/* ✅ Affichage de la donnée finale */}
                {!loading && !error && articles.length === 0 && (
                    <p style={{ textAlign: 'center' }}>Aucun article trouvé.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {articles.map((article) => (
                        <article
                            key={article.id}
                            className="glass-panel"
                            style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}
                        >
                            <div>
                                {article.cover_image_url && (
                                    <img 
                                        src={article.cover_image_url} 
                                        alt="Couverture" 
                                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                                    />
                                )}
                                <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{article.title}</h2>
                                <p style={{ color: 'var(--text-main)', lineHeight: '1.6', opacity: 0.9 }}>{article.content}</p>
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.7 }}>
                                    Par l'auteur #{article.authorId || article.author_email}
                                </div>
                            </div>

                            {/* Actions CRUD pour chaque article (Cachées si Reader) */}
                            {userRole !== 'Reader' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        style={{ padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => navigate(`/edit-article/${article.id}`)}
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        style={{ padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => handleDelete(article.id)}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                {/* 🔢 Contrôles de Pagination et de Limite */}
                {!loading && articles.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                        
                        {/* Contrôles de pages (Précédent / Suivant) - Uniquement s'il y a plusieurs pages */}
                        {pagination.totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: pagination.currentPage === 1 ? 'grey' : 'var(--primary-color)' }}
                                    disabled={pagination.currentPage === 1}
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                >
                                    Précédent
                                </button>
                                
                                <span style={{ color: 'white' }}>
                                    Page {pagination.currentPage} sur {pagination.totalPages}
                                </span>

                                <button
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: pagination.currentPage === pagination.totalPages ? 'grey' : 'var(--primary-color)' }}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}

                        {/* Contrôle de la Limite (Nombre d'articles par page) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label htmlFor="limitSelect" style={{ color: '#a8b2d1' }}>Articles par page :</label>
                            <select 
                                id="limitSelect" 
                                value={limit} 
                                onChange={handleLimitChange}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: 'none', backgroundColor: '#1e293b', color: 'white' }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
