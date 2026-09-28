/**
 * ============================================================================
 * COMPOSANT UI : PaginationControls
 * ============================================================================
 * 🎓 CONCEPT SENIOR : ISOLATION DE L'UI
 * 
 * Tout ce qui concerne la pagination visuelle est ici. Le composant parent
 * lui passe simplement la page courante, le total, et les fonctions de callback.
 */
const PaginationControls = ({ pagination, limit, onPageChange, onLimitChange }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            
            {/* Contrôles de pages - Affichés seulement si plusieurs pages */}
            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem', backgroundColor: pagination.currentPage === 1 ? 'grey' : 'var(--primary-color)' }}
                        disabled={pagination.currentPage === 1}
                        onClick={() => onPageChange(pagination.currentPage - 1)}
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
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                    >
                        Suivant
                    </button>
                </div>
            )}

            {/* Sélection de la limite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="limitSelect" style={{ color: '#a8b2d1' }}>Articles par page :</label>
                <select 
                    id="limitSelect" 
                    value={limit} 
                    onChange={onLimitChange}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: 'none', backgroundColor: '#1e293b', color: 'white' }}
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    );
};

export default PaginationControls;
