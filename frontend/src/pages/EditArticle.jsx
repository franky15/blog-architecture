import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSingleArticleThunk, updateArticleThunk } from '../features/articleSlice';
import api from '../services/api';

/**
 * ============================================================================
 * PAGE EDIT ARTICLE
 * ============================================================================
 */
const EditArticle = () => {
    // 💡 useParams permet d'extraire la variable "id" de l'URL (ex: /edit-article/5)
    const { id } = useParams();

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // On récupère "singleArticle" (l'article seul) depuis le Store Redux
    const { singleArticle, loading, error } = useSelector((state) => state.articles);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [localError, setLocalError] = useState('');

    // Unsplash
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        dispatch(fetchSingleArticleThunk(id));
    }, [dispatch, id]);

    useEffect(() => {
        // On vérifie que singleArticle existe et correspond bien à l'ID de l'URL
        if (singleArticle && singleArticle.id == id) {
            setTitle(singleArticle.title);
            setContent(singleArticle.content);
            setCoverImageUrl(singleArticle.cover_image_url || '');
        }
        /**
         * . Pourquoi pas de useMemo sur singleArticle ?
         * C'est la magie de Redux ! La fonction useSelector est extrêmement intelligente.
         * Elle garantit que si la donnée n'a pas changé dans le Store Redux, elle renvoie exactement la même référence mémoire (le même objet).
         * Donc, singleArticle est naturellement "gelé" par Redux tant qu'on ne le modifie pas !
         * C'est pour ça qu'on peut le mettre dans le useEffect en toute sécurité sans useMemo.
         */
    }, [singleArticle, id]);

    const handleSearchImages = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const response = await api.get(`/images/search?query=${searchQuery}`);
            setSearchResults(response.data.results);
        } catch (err) {
            console.error("Erreur Unsplash :", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!title || !content) {
            setLocalError("Le titre et le contenu sont obligatoires.");
            return;
        }

        try {
            // Envoi de JSON classique : updateArticleThunk({ id, articleData })
            await dispatch(updateArticleThunk({
                id,
                articleData: { title, content, cover_image_url: coverImageUrl }
            })).unwrap();

            navigate('/');
        } catch (err) {
            console.error("Erreur lors de la modification :", err);
        }
    };

    if (loading && !singleArticle) {
        return <p style={{ textAlign: 'center', padding: '2rem' }}>Chargement de l'article... ⏳</p>;
    }

    return (
        <div className="app-container" style={{ padding: '2rem' }}>
            <main className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Modifier l'article ✍️</h1>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    {(localError || error) && (
                        <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                            {localError || error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="title">Titre</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-bg)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="content">Contenu</label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="6"
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-bg)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                        </div>

                        {/* SECTION RECHERCHE IMAGE UNSPLASH */}
                        <div style={{ padding: '1rem', border: '1px solid var(--glass-bg)', borderRadius: '8px' }}>
                            <h3>Changer l'image (Unsplash)</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Rechercher (ex: tech...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px' }}
                                />
                                <button type="button" onClick={handleSearchImages} className="btn-primary" disabled={isSearching}>
                                    {isSearching ? '...' : 'Chercher'}
                                </button>
                            </div>

                            {/* Affichage de l'image sélectionnée/actuelle */}
                            {coverImageUrl && (
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <p style={{ color: '#10b981', marginBottom: '0.5rem' }}>Image de l'article</p>
                                    <img src={coverImageUrl} alt="Sélection" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div>
                                        <button type="button" onClick={() => setCoverImageUrl('')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
                                            Retirer l'image
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Grille de résultats */}
                            {searchResults.length > 0 && !coverImageUrl && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                    {searchResults.map((img) => (
                                        <img
                                            key={img.id}
                                            src={img.url_small}
                                            alt={img.description}
                                            onClick={() => setCoverImageUrl(img.url_regular)}
                                            style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px', border: '2px solid transparent' }}
                                            onMouseOver={(e) => e.currentTarget.style.border = '2px solid var(--primary-color)'}
                                            onMouseOut={(e) => e.currentTarget.style.border = '2px solid transparent'}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
                                onClick={() => navigate('/')}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditArticle;
