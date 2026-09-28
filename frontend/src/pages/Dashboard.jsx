import { useNavigate } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import ArticleCard from '../components/ui/ArticleCard';
import PaginationControls from '../components/ui/PaginationControls';

/**
 * ============================================================================
 * PAGE DASHBOARD REFONDUE (Architecture Senior)
 * ============================================================================
 * 🎓 Regarde comme le fichier a fondu (de 220 lignes à 70 lignes) !
 * 
 * Pourquoi c'est du code Senior ?
 * 1. AUCUNE LOGIQUE MÉTIER ici. Redux (useDispatch, useSelector) a complètement disparu.
 * 2. Le composant est "pur" (Clean Code) : Il ne fait qu'une chose (afficher la grille).
 * 3. Toute la complexité (Thunks, API, Pagination) est cachée dans `useArticles()`.
 * 4. La complexité visuelle est sous-traitée à `<ArticleCard />` et `<PaginationControls />`.
 * 
 * Si un bug survient sur la récupération de donnée -> On va voir `useArticles.js`.
 * Si un bug survient sur l'affichage d'une carte -> On va voir `ArticleCard.jsx`.
 * C'est le principe de Responsabilité Unique (SOLID).
 */
const Dashboard = () => {
    const navigate = useNavigate();
    
    // Le Cerveau (Custom Hook) nous fournit tout sur un plateau d'argent !
    const {
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
    } = useArticles(1); // On injecte le spaceId (1 pour le moment)

    return (
        <div className="app-container" style={{ padding: '2rem' }}>
            <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1>Tableau de bord 📝</h1>
                    <p style={{ color: '#a8b2d1', marginBottom: '1.5rem' }}>Bienvenue <strong>{user?.username}</strong>. Voici tes articles :</p>

                    {/* Rendu conditionnel UI (Caché si l'utilisateur est uniquement Reader) */}
                    {userRole !== 'Reader' && (
                        <button className="btn-primary" onClick={() => navigate('/create-article')}>
                            + Rédiger un nouvel article
                        </button>
                    )}
                </header>

                {/* ⏳ Gestion des états (Loading / Error / Empty) */}
                {loading && <p style={{ textAlign: 'center' }}>Chargement des articles en cours... ⏳</p>}

                {error && (
                    <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px' }}>
                        Erreur : {error}
                    </div>
                )}

                {!loading && !error && articles.length === 0 && (
                    <p style={{ textAlign: 'center' }}>Aucun article trouvé.</p>
                )}

                {/* ✅ Affichage de la donnée avec notre "Dumb Component" ArticleCard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {articles.map((article) => (
                        <ArticleCard 
                            key={article.id} 
                            article={article} 
                            userRole={userRole} 
                            onDelete={handleDelete} 
                        />
                    ))}
                </div>

                {/* 🔢 Contrôles de Pagination (Délégués au sous-composant) */}
                {!loading && articles.length > 0 && (
                    <PaginationControls 
                        pagination={pagination} 
                        limit={limit} 
                        onPageChange={handlePageChange} 
                        onLimitChange={handleLimitChange} 
                    />
                )}
            </main>
        </div>
    );
};

export default Dashboard;
