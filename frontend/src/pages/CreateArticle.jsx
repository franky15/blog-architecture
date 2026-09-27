import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createArticleThunk } from '../features/articleSlice';
import api from '../services/api';

/**
 * ============================================================================
 * PAGE CREATE ARTICLE
 * ============================================================================
 */
const CreateArticle = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [localError, setLocalError] = useState('');

    // Pour la recherche Unsplash
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { loading, error } = useSelector((state) => state.articles);

    const handleSearchImages = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            // L'appel utilise l'intercepteur pour envoyer le Token
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
            // 🛫 Envoi des données JSON classiques (PAS de FormData ici car l'image est une URL)
            await dispatch(createArticleThunk({ 
                title, 
                content, 
                cover_image_url: coverImageUrl 
            })).unwrap();
            
            navigate('/');
        } catch (err) {
            console.error("Erreur lors de la création :", err);
        }
    };

    return (
        <div className="app-container" style={{ padding: '2rem' }}>
            <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Rédiger un nouvel article ✍️</h1>
                
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
                            <label htmlFor="content">Contenu de l'article</label>
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
                            <h3>Image de couverture (Unsplash)</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="Rechercher une image (ex: nature, tech...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px' }}
                                />
                                <button type="button" onClick={handleSearchImages} className="btn-primary" disabled={isSearching}>
                                    {isSearching ? '...' : 'Chercher'}
                                </button>
                            </div>

                            {/* Affichage de l'image sélectionnée */}
                            {coverImageUrl && (
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <p style={{ color: '#10b981', marginBottom: '0.5rem' }}>✓ Image sélectionnée</p>
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
                                {loading ? 'Création en cours...' : 'Publier l\'article'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateArticle;
