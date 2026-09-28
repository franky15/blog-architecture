import { useNavigate } from 'react-router-dom';

/**
 * ============================================================================
 * COMPOSANT UI : ArticleCard (Le Composant Présentationnel)
 * ============================================================================
 * 🎓 CONCEPT SENIOR : DUMB COMPONENTS (Composants stupides)
 * 
 * Ce composant est "stupide" : il ne sait RIEN de Redux, ni de l'API.
 * Il ne fait que recevoir des 'props' (article, userRole, onDelete) et affiche du HTML.
 * 
 * Avantage : Il est 100% réutilisable. Si on veut l'utiliser sur une autre page 
 * avec d'autres données (pas Redux), il marchera parfaitement !
 */
const ArticleCard = ({ article, userRole, onDelete }) => {
    const navigate = useNavigate();

    return (
        <article
            className="glass-panel article-card"
            style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}
        >
            <div>
                {article.cover_image_url && (
                    <img 
                        src={article.cover_image_url} 
                        alt="Couverture" 
                        className="article-image"
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                    />
                )}
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{article.title}</h2>
                <p style={{ color: 'var(--text-main)', lineHeight: '1.6', opacity: 0.9 }}>{article.content}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.7 }}>
                    Par l'auteur #{article.authorId || article.author_email}
                </div>
            </div>

            {/* Sécurité UI : On cache les boutons de modification/suppression si on est simple lecteur */}
            {userRole !== 'Reader' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        className="btn-outline-secondary"
                        onClick={() => navigate(`/edit-article/${article.id}`)}
                    >
                        Modifier
                    </button>
                    <button
                        className="btn-outline-danger"
                        onClick={() => onDelete(article.id)}
                    >
                        Supprimer
                    </button>
                </div>
            )}
        </article>
    );
};

export default ArticleCard;
