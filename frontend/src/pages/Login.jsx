import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUserThunk } from '../features/authSlice';

const Login = () => {
    // 💡 La donnée locale (Trajet 1). On stocke ce que tape l'utilisateur.
    // Cela n'a rien à voir avec Redux, c'est juste la mémoire de l'écran actuel.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 💡 Les Outils
    // useDispatch est un hook qui permet d'envoyer une action a reddux donc envoyer la données du formulaire au slice
    const dispatch = useDispatch();
    // use navigate est un hook qui permet de naviguer entre les pages
    const navigate = useNavigate();

    // 💡 La lecture du Garde-Manger (Trajet 2)
    // On observe l'état du Slice pour savoir si ça charge, ou s'il y a une erreur
    // useSelector est un hook qui permet de récupérer une partie de l'état de redux ici on recupere les données du slice auth
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        // On empêche la page de se rafraîchir car le rafraichissement de la page  est un comportement pardefaut 
        // qu'on ne souhaite pas ici car il vide le cache redux et donc deconnecte l'utilisateur ou efface toutes
        //les donnees non sauvegarder lorsqu'on soumet le formulaire on doit donc l'empecher pour que 
        //le thunk puisse s'executer et retourner la donnee au reducer sans etre interrompu par le rafraichissement
        //e.preventDefault() est une fonction qui permet d'empecher le comportement pardefaut de la page
        //et e.preventDefault()  ici provient de onSubmit qui est une fonction native de js ou react js d'ou il a un comportement pardefaut
        e.preventDefault();

        // On lance le Thunk (le livreur). `unwrap()` permet d'attraper l'erreur ici s'il y en a une,
        // ou de continuer si la promesse est réussie (fulfilled).
        /**
         * Alors à quoi sert .unwrap() exactement ? 
         * Le unwrap() sert uniquement ici pour le composant React (Login.jsx) rien a avoir avec le thunk et slice il ne les impacte pas du tout.
         * Par défaut, quand tu fais un dispatch(unThunk), 
         * Redux "avale" l'erreur pour éviter que toute ton application React ne crashe. 
         * Résultat : ton bloc catch(err) dans Login.jsx ne s'exécutera JAMAIS, même si le mot de passe est faux ! 
         * Le .unwrap() permet de "déballer" la promesse. S'il voit que l'état final est rejected, 
         * il va lever une vraie erreur Javascript, ce qui force ton code React à tomber dans le bloc catch (err) 
         * pour réagir correctement (ex: vider le formulaire).
         */
        try {
            // on envoie les données du formulaire au slice ici authSlice car la fonction loginUserThunk est defini dans authSlice
            //unwrap permet de recuperer les donnees du thunk ou d'attraper l'erreur s'il y en a une 
            //donc on continue si la promesse est reussie (fulfilled) et on arrete si la promesse est rejetee (rejected)
            //dispatch est une fonction qui permet d'envoyer une action a reddux donc envoyer la données du formulaire au slice ici authSlice
            await dispatch(loginUserThunk({ email, password })).unwrap();

            // Si on arrive ici, c'est que le login a réussi ! 
            // Le Thunk a déjà stocké le User dans Redux. On peut rediriger vers l'accueil.
            // navigate est un hook qui permet de naviguer entre les pages
            navigate('/');
        } catch (err) {
            console.error("Échec de la connexion :", err);
            // Pas besoin d'afficher l'erreur manuellement, Redux l'a mise dans 'error' !
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Connexion</h2>

                {/* Affichage des erreurs provenant de Redux */}
                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-bg)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-bg)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'Connexion en cours...' : 'Se Connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
