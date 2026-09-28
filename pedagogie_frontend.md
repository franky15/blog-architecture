# Manifeste Pédagogique & Architecture Frontend (React + Redux Toolkit)

Ce document agit comme le guide ultime (niveau Senior) de l'architecture Frontend de notre blog.
Tout concept abordé ici, même complexe, est expliqué de manière limpide, avec la métaphore de la **Restauration** pour comprendre la logique métier.

---

## 1. L'Architecture du Frontend (Le Restaurant)

Notre dossier `src` est structuré pour une séparation stricte des responsabilités :
- 🧱 **`components/` (La Salle)** : Les boutons, modales, champs de texte. Ils sont "stupides". Ils affichent ce qu'on leur donne (`props`), un point c'est tout.
- 🖼️ **`pages/` (Les Maîtres d'Hôtel)** : Les vues principales. Elles récupèrent les données et les distribuent aux composants de la salle.
- 📡 **`services/` (Les Camions de Livraison)** : Les appels API avec **Axios**. C'est le seul endroit qui communique avec l'extérieur (notre Backend Express).
- 🧠 **`features/` (Les Stations de Cuisine - Redux)** : La logique de nos données globales (ex: savoir si on est connecté, la liste des articles).
- 🎨 **`styles/` (La Décoration)** : Le CSS Vanilla structuré (variables, thèmes).

---

## 2. Redux Toolkit Démystifié : Fini la confusion !

La plus grande difficulté avec Redux est la confusion du vocabulaire. Soyons chirurgicaux.
Dans Redux, on sépare strictement les **données**, les **intentions** et la **logique de modification**.

### Le Vocabulaire Strict (La Métaphore de la Cuisine)
1. **L'État / State (Le Garde-Manger)** : C'est un simple objet JavaScript qui contient les données actuelles (ex: `user: { name: 'Bob' }`).
2. **L'Action (Le Bon de Commande papier)** : C'est **TOUJOURS un simple objet**, JAMAIS une fonction. Il a deux propriétés obligatoires :
   - `type` : "Le nom du plat" (ex: `"auth/login"`).
   - `payload` : "Les ingrédients fournis par le client" (ex: `{ email: 'a@a.com' }`).
3. **Le Reducer (Le Cuisinier / Chef de Partie)** : C'est **TOUJOURS une fonction**. Elle prend le Garde-Manger actuel (`state`) et le Bon de Commande (`action`), et produit un Garde-Manger mis à jour. **Règle d'or : Un Reducer est 100% SYNCHRONE.**
4. **L'Action Creator (L'Imprimante à Bons de Commande)** : C'est une **fonction** dont le seul but est de fabriquer (retourner) l'objet Action.

> [!CAUTION]
> **La grande confusion Redux Toolkit** : Quand tu écris une fonction dans la section `reducers: {}` de ton slice, Redux Toolkit crée **secrètement et automatiquement** un *Action Creator* (une imprimante) qui porte le *même nom*.
> Quand tu fais `export const { login } = authSlice.actions;`, tu n'exportes **PAS** le reducer. Tu exportes l'imprimante (la fonction qui va créer l'Action) ! Tes composants appelleront cette imprimante pour générer un bon de commande qui sera envoyé au VRAI reducer caché en cuisine.

### Exemple avec authSlice.js
```javascript
// 👇 1. LES REDUCERS (Les Cuisiniers)
reducers: {
    login: (state, action) => { // 'action' ici est un OBJET { type: "auth/login", payload: {...} }
        state.user = action.payload; 
        state.isLogged = true;
    }
}

// 👇 2. LES ACTION CREATORS (Les Imprimantes à bons de commande)
// Magie Toolkit : Pour chaque cuisinier (Reducer), Toolkit a créé une fonction "Action Creator" (une imprimante).
// En exportant 'login', on exporte la fonction qui permet d'imprimer l'Action (l'objet), PAS le reducer lui-même !
export const { login, logout } = authSlice.actions; 
```

---

## 3. Comment les Composants parlent à Redux ? (useSelector / useDispatch)

Tes composants React (la Salle de Restaurant) n'ont pas le droit d'entrer en cuisine. Ils utilisent deux talkie-walkies (des "Hooks") :

- **`useSelector` (Lire le Menu)** : Permet au composant de "lire" une donnée dans le Garde-Manger. Si la donnée change dans le futur, le composant se met à jour tout seul.
  ```javascript
  const isLogged = useSelector((state) => state.auth.isLogged);
  ```
- **`useDispatch` (Le Serveur en salle)** : Permet d'envoyer un Bon de Commande (une Action) à la cuisine.
  ```javascript
  const dispatch = useDispatch();
  // On appelle l'Action Creator 'login()' qui fabrique l'Action, et 'dispatch' l'envoie en cuisine !
  dispatch(login({ name: 'Bob' }));
  ```

---

## 4. Le Cycle de Vie de la Donnée (Le Trafic Frontend <-> Backend)

C'est ici que 90% des développeurs juniors se perdent. Comment la donnée circule-t-elle exactement ? Et à quoi servent les Slices dans ce trafic ?

**Règle d'or :** Les Slices (Redux) servent principalement à stocker la donnée qui **REVIENT** du backend pour la distribuer à toute l'application. La donnée que l'on veut **ENVOYER** au backend (ex: ce que l'on tape dans un formulaire) n'a généralement pas besoin d'aller dans Redux, elle reste dans la mémoire locale du composant (`useState`).

### Le problème de l'Asynchrone
Les `Reducers` (Cuisiniers) sont 100% synchrones. Ils refusent d'attendre (pas de `async/await`). Or, contacter notre Backend Express prend du temps.
Pour résoudre cela, Redux utilise un **"Thunk" (un Livreur Deliveroo Asynchrone)**. C'est une fonction spéciale qui gère l'aller-retour avec le backend.

### 🛣️ Trajet 1 : L'Envoi (Frontend ➔ Backend)
*Exemple : Un utilisateur remplit le formulaire de Login.*
1. **La Saisie (Entrée de la donnée)** : L'utilisateur tape son email et mot de passe dans le composant `<Login />`. Ces données sont stockées localement dans le composant via `useState`. (Elles ne sont pas encore dans Redux).
2. **Le Clic (Le Départ)** : L'utilisateur clique sur "Se Connecter". Le composant "dispatch" le Thunk (il donne le sac avec email/password au Livreur).
3. **Le Service (Axios)** : Le Thunk appelle notre fichier `services/api.js` pour envoyer une requête POST (`api.post('/auth/login', { email, password })`).
4. **Le Backend** : Le serveur Express reçoit la requête, vérifie en base de données, et génère une réponse (le profil de l'utilisateur + le Token JWT).

### 🛣️ Trajet 2 : La Réception (Backend ➔ Frontend)
*Exemple : Le Backend vient de répondre avec succès au Login.*
1. **Le Retour du Livreur** : Le Thunk reçoit la réponse JSON d'Express (le Profil Utilisateur + le Token).
2. **Le Stockage Local (Token)** : Le Thunk sauvegarde immédiatement le Token dans le `localStorage` du navigateur pour les futures requêtes.
3. **La Création de l'Action** : Le Thunk fabrique enfin un Bon de Commande synchrone (Une `Action`) qui contient le Profil Utilisateur dans son `payload`, et il la "dispatch" (l'envoie) au Reducer.
4. **Le Reducer (Le Slice)** : Le cuisinier (dans `authSlice.js`) reçoit l'Action. Il extrait le profil utilisateur du `payload` et le stocke définitivement dans le **State Global** (Le Garde-Manger).
5. **La Redistribution (L'Affichage)** : N'importe quel composant de l'application (ex: la `Navbar`) qui écoute avec `useSelector((state) => state.auth.user)` voit instantanément que le profil est arrivé, et se met à jour pour afficher "Bonjour, Bob !".

### 💡 Zoom sur les rouages secrets du Thunk (pending, fulfilled, rejected)

C'est ici qu'intervient la vraie magie de Redux Toolkit. D'où viennent les états `pending`, `fulfilled` et `rejected` ?

1. **La Création des 3 Actions Automatiques** :
   Quand tu utilises `createAsyncThunk`, tu n'as pas besoin de créer d'Actions manuellement.
   Dès que tu fais `dispatch(loginUserThunk())`, voici ce qui se passe **automatiquement sous le capot** :
   - 🛫 Redux "imprime" une Action `auth/loginUser/pending` et l'envoie au Reducer (pour dire "Le livreur est en route", on met `loading = true`).
   - ✅ Si la requête Axios réussit : Redux "imprime" une Action `auth/loginUser/fulfilled` (avec les données en `payload`) et l'envoie au Reducer.
   - ❌ Si Axios échoue (ex: Erreur 401 captée par `rejectWithValue`) : Redux "imprime" une Action `auth/loginUser/rejected` et l'envoie au Reducer.

2. **À quoi sert le `.unwrap()` dans le composant React ?**
   Dans React (ex: `Login.jsx`), quand tu fais `await dispatch(loginUserThunk())`, par défaut Redux intercepte toutes les erreurs silencieusement pour le bien de l'application. Il n'y aura pas de "crash" JavaScript, et ton code ne rentrera **jamais** dans le bloc `catch (err)` !
   Le `.unwrap()` permet d'extraire (déballer) la promesse brute du Thunk. Si l'action finale est `fulfilled`, il renvoie la donnée. Si l'action finale est `rejected`, **il lève une vraie erreur JavaScript**, ce qui permet à ton bloc `try...catch` de l'attraper dans ton composant React.

3. **Pourquoi le Thunk DOIT passer par `extraReducers` ?**
   C'est la règle de fer de Redux. Un Thunk (une fonction asynchrone) **N'A PAS LE DROIT** de modifier le State directement. Seul le Cuisinier (Le Reducer) a la clé du Garde-Manger. Le Thunk fait tout son travail (la requête API asynchrone) à l'extérieur de la cuisine. Quand il a terminé, il crée le bon de commande (`fulfilled` ou `rejected`) et le glisse sous la porte de la cuisine (qui est 100% synchrone). Le Reducer le lit dans `extraReducers` et met enfin le State à jour.

---

## 5. Les Appels API (Axios & Services)

On utilise Axios dans le dossier `services/` pour créer un connecteur propre.

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // L'URL de notre super Backend Express
});

// Intercepteur : Avant même que la requête ne parte vers le backend, Axios l'intercepte dans le but d'inserer le token dans le header de la requête pour que le backend puisse l'authentifier.
api.interceptors.request.use((config) => {
    // 💡 localStorage est 100% SYNCHRONE (très rapide). Il lit directement sur le disque dur du navigateur.
    const token = localStorage.getItem('token');
    
    // Si on a un jeton, on le glisse automatiquement dans le "sac à dos" (Headers) de la requête ! ca donnera Authorization: `Bearer ${token}` dans le Header de la requête qui va vers le backend. C'est grâce a cela que l'authentification se fera dans le backend.
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

export default api;
```

---

## 6. Performances Frontend : Problèmes et Solutions (Éviter la surchauffe)

React est extrêmement puissant, mais son comportement par défaut peut créer de gros problèmes de performance.
**Le problème fondamental** : À chaque fois que l'état d'un composant change (ex: tu tapes une lettre dans un input), React "re-dessine" (re-render) ce composant **ET tous ses composants enfants**. Sur une grosse page, cela peut faire ramer le navigateur.

### Les Solutions (Les Outils du Senior) :

- **Problème : Les calculs lourds sont refaits à chaque fois.**
  - **Solution : `useMemo` (La calculatrice en mémoire)**. Si tu as une fonction qui trie 10 000 articles, enveloppe-la dans `useMemo`. React gardera le résultat en mémoire et ne le recalculera que si la liste originale change.
- **Problème : Les composants enfants se redessinent pour rien.**
  - **Solution : `React.memo` et `useCallback`**. `React.memo` permet de dire à un composant enfant "Ne te redessine pas si tes props n'ont pas changé". Et `useCallback` permet de mémoriser une fonction (comme un `onClick`) pour ne pas la recréer en boucle, ce qui casserait le `React.memo`.
- **Problème : L'application est trop lourde à télécharger.** (Fichier bundle.js énorme).
  - **Solution : `Code Splitting` (React.lazy)**. Au lieu de forcer l'utilisateur à télécharger tout le site d'un coup, on découpe le code. Si l'utilisateur n'est pas admin, il ne téléchargera jamais le code de la page Admin. Elle ne se chargera que s'il clique sur le lien.

---

## 7. Sécurité Frontend (Le Bouclier de l'Application)

Notre backend est sécurisé, mais le frontend a ses propres failles.

- **La faille XSS (Cross-Site Scripting)** : C'est l'attaque n°1 en frontend. Si un utilisateur malveillant écrit `<script>volerToken()</script>` dans le contenu d'un article, et que tu l'affiches tel quel, son code s'exécutera chez les autres utilisateurs ! 
  - *La Défense* : React nous protège nativement (il convertit le code en simple texte d'affichage). Mais attention à ne JAMAIS utiliser `dangerouslySetInnerHTML` sans nettoyer (sanitizer) la donnée d'abord.
- **Le vol de Token (LocalStorage vs Cookies)** : Le `localStorage` (où nous stockons temporairement notre jeton JWT) est lisible par n'importe quel script JavaScript. Si un pirate réussit une attaque XSS mineure, il peut lire `localStorage.getItem('token')` et te pirater.
  - *La Vraie Solution (Entreprise)* : En production, c'est le Backend Express qui doit envoyer le Token caché dans un **Cookie `HttpOnly`**. Ce type de cookie est verrouillé par Chrome/Firefox. Le code JavaScript (React) n'a **strictement aucun moyen de le lire**. Le hacker ne peut donc pas le voler via XSS ! (Nous implémenterons ceci dans une phase ultérieure).

### 7.1 Sécurité de l'Interface (UX) vs Sécurité Réelle (Backend)

En frontend, on masque souvent des boutons (ex: "Supprimer", "Editer") si l'utilisateur n'a pas le bon rôle (ex: s'il n'est pas Admin).
C'est pour cela que le frontend fait appel à des routes spécifiques du backend (comme `GET /api/spaces/:spaceId/role`) gérées par un `spaceController.js`. Le but de ce contrôleur n'est **pas** de sécuriser l'application, mais d'**informer** le frontend pour qu'il puisse adapter son affichage.

**⚠️ RÈGLE D'OR DE L'ARCHITECTE :**
Cacher un composant React (avec `if (!isAdmin) return null;`) **n'est pas une mesure de sécurité**. C'est uniquement de l'**Expérience Utilisateur (UX)** pour éviter de frustrer l'utilisateur avec des boutons qui ne marchent pas.
Un utilisateur malveillant pourrait très bien bypasser le frontend (avec Postman) et taper directement sur l'API.
C'est pourquoi le backend a **obligatoirement** besoin d'un middleware (ex: `rbacMiddleware.js`) qui revérifie la sécurité en profondeur (le "Videur"), peu importe ce que le frontend a caché ou non !

### 7.2 L'Impact Frontend du Choix d'Architecture (Global vs Contextuel)

Le choix de la méthode de sécurité côté Backend a un impact massif sur la complexité du code Frontend :

1. **Si tu utilises un "Global RBAC" (Rôle Global dans la table Users) :**
   Le Frontend est très facile à coder. Au moment du `login`, le backend renvoie `{ email, nom, role: 'Admin' }`. Tu stockes ce `role` global une seule fois dans Redux (`authSlice`). Ensuite, n'importe quel composant peut faire `if (user.role === 'Admin')` pour afficher un bouton.

2. **Si tu utilises un "Contextual RBAC" (Rôle par Espace) - *Notre architecture actuelle* :**
   Le Frontend devient plus complexe. L'utilisateur n'a plus de rôle global. Le Frontend est obligé de "demander" au Backend quel est le rôle de l'utilisateur **à chaque fois** qu'il entre dans un nouvel espace. C'est pour cela que dans le `Dashboard.jsx`, on est obligé de faire un `dispatch(fetchUserRoleThunk(spaceId))` à chaque changement de page/espace pour mettre à jour l'interface (afficher/cacher les boutons) de façon dynamique.

---

## 8. CSS Vanilla & Design Premium

- **Variables CSS (`styles/variables.css`)** : Centralisation totale dans la balise `:root`. Modifier la charte graphique globale se fait en changeant une seule ligne.
- **Fluidité (Glassmorphism & Transitions)** : Un frontend premium ne demande pas des dizaines de librairies. Nous utilisons l'accélération matérielle native (`transform`, `opacity`, `backdrop-filter`) pour créer des interfaces vivantes, réactives au survol, sans pénaliser la performance de la page.

---

## 9. Les Fondations JavaScript (Imports & Exports)

Une confusion courante chez les développeurs concerne le nommage lors des imports (ex: pourquoi le `reducer` de `authSlice` s'appelle `authReducer` dans le `store.js` ?).
Il existe deux manières d'exporter des éléments en JavaScript (ES6) :

### 1. L'Export par Défaut (`export default`)
- **Syntaxe** : `export default monReducer;`
- **L'Import** : `import nImporteQuelNom from './fichier';` (SANS accolades).
- **Le Concept** : L'élément est exporté sans nom strict. Le fichier qui l'importe a le droit (et le devoir) de choisir le nom qu'il veut pour l'utiliser. C'est pourquoi on a le droit de renommer `authSlice.reducer` en `authReducer` dans `store.js`.

### 2. L'Export Nommé (`export const`)
- **Syntaxe** : `export const logout = ...`
- **L'Import** : `import { logout } from './fichier';` (AVEC accolades).
- **Le Concept** : L'élément possède un nom strict. Tu es **obligé** d'utiliser exactement ce nom-là, et de l'entourer d'accolades.

---

## 10. Les Mystères du useEffect et du Tableau de Dépendances

Une des plus grandes confusions en React concerne le hook `useEffect` et son fameux tableau `[]`.
Prenons l'exemple de notre `Dashboard.jsx` :

```javascript
useEffect(() => {
    dispatch(fetchArticlesThunk());
}, [dispatch]);
```

**Pourquoi ce code ne crée-t-il pas une boucle infinie ?**
Voici l'explication étape par étape de ce qu'il se passe :

1. **Quand s'exécute-t-il ?**
   - Le `useEffect` s'exécute à l'arrivée (au montage) du composant sur l'écran. 

2. **À quoi sert le tableau `[dispatch]` ?**
   - C'est le **Tableau de dépendances**. Il dit à React : *"Ne réexécute ce useEffect QUE si la variable `dispatch` a changé en mémoire."*
   - C'est **très important** : ce tableau n'est PAS un écouteur d'actions. Il ne capte *absolument pas* les "dispatches" envoyés par d'autres composants. Il vérifie uniquement si la définition même de la fonction `dispatch` a été remplacée par une nouvelle fonction.
   - Or, la fonction `dispatch` (fournie par Redux) est **STABLE**. Elle est construite une fois pour toutes au lancement de l'application et ne change **jamais**.

3. **Le scénario du non-bouclage** :
   - Étape A : Le composant s'affiche.
   - Étape B : Le `useEffect` s'exécute et lance `dispatch(...)`.
   - Étape C : Le backend répond, et Redux met à jour l'état (les articles).
   - Étape D : Le `useSelector` voit les nouveaux articles et **redessine** le composant (re-render).
   - Étape E : En redessinant, React arrive sur le `useEffect`. Il regarde le tableau `[dispatch]` et se demande : *"Est-ce que la fonction `dispatch` a changé depuis l'Étape A ?"*
   - Étape F : La réponse est **NON**. Donc, React **saute** le `useEffect`.
   - Conclusion : Pas de boucle infinie ! Le fetch n'est fait qu'une seule fois.

*Note : On met `[dispatch]` au lieu de `[]` simplement parce que les règles (Linters) de React exigent que toute variable externe utilisée à l'intérieur du useEffect soit listée dans le tableau, pour éviter des bugs de variables obsolètes (Stale Closures).*

### 10.1 Comment créer une Boucle Infinie (L'Erreur Classique)
La boucle infinie se produit quand **ton `useEffect` modifie une variable, ET que cette même variable est dans le tableau de dépendances** (directement ou indirectement).

**Exemple fatal :**
```javascript
const [count, setCount] = useState(0);

useEffect(() => {
    // 2. Le useEffect s'exécute et modifie "count"
    setCount(count + 1); 
}, [count]); // 1. Le useEffect écoute "count"

// RÉSULTAT :
// count change -> Le composant se redessine -> React voit que count a changé -> Il relance le useEffect -> count change -> Le composant se redessine... BOUCLE INFINIE 💥
```
*Autre piège de boucle infinie : Mettre un objet `[monObjet]` ou un tableau `[monTableau]` qui est recréé à chaque rendu dans les dépendances. En JavaScript, `{}` n'est pas égal à `{}` (références mémoires différentes).*

### 10.2 Utiliser Plusieurs `useEffect` dans un Composant
**OUI**, c'est même **fortement recommandé** ! 
Un `useEffect` doit faire **UNE SEULE CHOSE** (Principe de Responsabilité Unique).

**Exemple de bonne pratique :**
```javascript
// useEffect n°1 : Gérer les articles
useEffect(() => {
    dispatch(fetchArticlesThunk());
}, [dispatch]);

// useEffect n°2 : Gérer un chronomètre ou un événement
useEffect(() => {
    const timer = setInterval(() => console.log("Tic Tac"), 1000);
    
    // ⚠️ LE PIÈGE À ÉVITER : Le nettoyage (Cleanup)
    // Si tu lances un processus continu (setInterval, écouteur d'évènement window.addEventListener),
    // tu DOIS retourner une fonction de nettoyage pour l'arrêter quand le composant disparaît (démontage).
    // Sinon : Fuite de mémoire (Memory Leak) !
    return () => clearInterval(timer);
}, []);
```

**Les Pièges à éviter avec les multiples `useEffect` :**
1. **L'oubli du nettoyage (Cleanup function)** : Toujours nettoyer les abonnements, WebSockets, ou Timeouts dans le `return () => {}` du `useEffect`.
2. **L'effet "Domino"** : Un `useEffect` modifie l'état A, ce qui déclenche un 2ème `useEffect` (qui écoute A), qui modifie l'état B, ce qui déclenche un 3ème `useEffect`... Le code devient un enfer à déboguer.
3. **Le "Sur-usage" (Over-fetching)** : Ne pas utiliser `useEffect` pour filtrer ou calculer une donnée. Si tu as une liste d'articles et que tu veux les filtrer, fais-le directement dans le rendu classique (ou avec `useMemo`), pas dans un `useEffect` !

### 10.3 Le Nettoyage (Cleanup) : Exhaustif ou pas ?
`setInterval`, `setTimeout` et `window.addEventListener` **ne sont pas des noms arbitraires**. Ce sont de vraies **fonctions natives de JavaScript** (liées au navigateur). 
De même, **`clearInterval` est la fonction native JavaScript** conçue spécifiquement pour arrêter un `setInterval`. Ce n'est pas un nom inventé ! Idem pour `clearTimeout` qui arrête `setTimeout`.

Ce ne sont pas les seuls cas où il faut faire un nettoyage. En fait, **toute fonction (qu'elle soit native JS, React, ou provenant d'une librairie externe)** qui crée un processus asynchrone continu doit être nettoyée. Voici la liste (presque exhaustive) :
- Chronomètres : `setInterval` (à nettoyer avec `clearInterval`) et `setTimeout` (à nettoyer avec `clearTimeout`).
- Écouteurs globaux du navigateur : `window.addEventListener('resize', ...)` ou `'scroll'` (à nettoyer avec `window.removeEventListener`).
- Connexions persistantes : `new WebSocket(...)` (à fermer avec `socket.close()`).
- Requêtes API en cours (Avancé) : Si l'utilisateur quitte la page alors que la requête Axios n'est pas finie, on l'annule avec un `AbortController`.

*Règle d'or : Tout ce qui "survit" en tâche de fond quand le composant est détruit doit être tué manuellement.*

### 10.4 Mettre un Tableau, un Objet ou une Fonction dans les Dépendances
Peut-on mettre autre chose qu'une simple valeur (string, number, boolean) dans le tableau de dépendances ?
**OUI, mais c'est DANGEREUX !**
En JavaScript, deux objets identiques ne sont pas égaux en mémoire. `[1, 2] === [1, 2]` donne `false`.
Si tu crées un tableau, un objet ou une fonction dans ton composant et que tu le mets dans les dépendances, **React croira qu'il a changé à chaque rendu**, créant une boucle infinie !

**❌ Exemple de la Boucle Infernale :**
```javascript
const Composant = () => {
    // ⚠️ À CHAQUE RENDU (re-render), JavaScript recrée cette fonction à une nouvelle adresse mémoire !
    const fetchData = () => api.get('/data'); 

    useEffect(() => {
        fetchData();
    }, [fetchData]); // 💥 BOUCLE INFINIE : fetchData est considérée "nouvelle" à chaque fois.
};
```

**✅ La solution : `useCallback` (pour les fonctions) et `useMemo` (pour les objets/tableaux)**
Ces hooks permettent de "geler" la référence en mémoire.

```javascript
import { useCallback, useMemo, useEffect } from 'react';

const Composant = () => {
    // 💡 useCallback gèle la fonction : elle gardera la MÊME adresse mémoire aux prochains rendus.
    const fetchData = useCallback(() => {
        api.get('/data');
    }, []); // Le tableau vide dit : "Ne recrée jamais cette fonction"

    // 💡 useMemo gèle l'objet/tableau : il gardera la MÊME adresse mémoire.
    const configObj = useMemo(() => {
        return { role: 'admin', active: true };
    }, []);

    // Maintenant, c'est 100% SÉCURISÉ de les mettre dans le tableau de dépendances !
    useEffect(() => {
        fetchData(configObj);
    }, [fetchData, configObj]); // ✅ Pas de boucle infinie !
};
```
- *(Note : La fonction `dispatch` de Redux est une exception magique. Redux l'a déjà "gelée" en interne pour nous, c'est pour ça qu'on peut la mettre sans danger).*

### 10.5 Plusieurs Dispatches = Plusieurs useEffect ?
Si tu dois lancer plusieurs dispatches au chargement d'une page (ex: `dispatch(fetchArticles())` et `dispatch(fetchCategories())`), **tu n'es PAS obligé** de créer plusieurs `useEffect` !
- **Bonne pratique** : On groupe la logique par **but/événement**. Si le but de ces deux dispatches est "Initialiser les données au chargement de la page", alors on les met **dans le même `useEffect`**.
```javascript
useEffect(() => {
    dispatch(fetchArticlesThunk());
    dispatch(fetchCategoriesThunk());
}, [dispatch]);
```
- On fera un *deuxième* `useEffect` uniquement si l'évènement déclencheur est différent (ex: Un deuxième `useEffect` qui s'exécute uniquement quand la variable `id` change dans l'URL).

### 10.6 Les Variables "Déclencheurs" (Triggers) non utilisées
Peut-on mettre dans le tableau de dépendances une variable qu'on n'utilise même pas à l'intérieur du `useEffect` ?
**OUI, tout à fait !** C'est une technique très courante appelée le motif du **"Trigger"** (Déclencheur).

Cela sert exactement au cas que tu décris : réagir à l'action d'un composant très lointain.
Puisque le composant est lointain (il n'est ni parent, ni enfant), le seul moyen pour eux de communiquer est de passer par le **Garde-Manger global (Redux)**.

**Le Scénario :**
1. Un composant lointain (ex: une barre de recherche globale dans le Header) modifie une valeur dans Redux (ex: `searchQuery`).
2. Ton composant `Dashboard` écoute cette valeur avec `useSelector`.
3. Tu ajoutes cette valeur dans le tableau de dépendances de ton `useEffect`. Même si tu ne l'utilises pas directement dans l'appel API, son simple **changement** va forcer le `useEffect` à se réexécuter !

**Exemple : Un bouton "Rafraîchir" global**
```javascript
// Dans Dashboard.jsx
const refreshTrigger = useSelector((state) => state.app.refreshTrigger);

useEffect(() => {
    // On relance le chargement des articles...
    dispatch(fetchArticlesThunk());
    
    // ... À chaque fois que refreshTrigger change, MÊME SI on ne s'en sert pas ici !
}, [dispatch, refreshTrigger]); 
```
*C'est la magie de l'état global combiné à `useEffect`. Le composant lointain a juste besoin d'incrémenter `refreshTrigger` dans Redux pour forcer le Dashboard à relancer son API !*

---

## 11. Le Concept de Truthy, Falsy et le Double Bang (`!!`)

En JavaScript, le comportement du point d'exclamation `!` (l'opérateur logique NOT) dépend d'un concept fondamental appelé **Truthy** et **Falsy**.

C'est une question très intelligente : *"Est-ce que le premier `!` transforme TOUJOURS une String en `false` et `null` en `true` ?"*
**La réponse est OUI, c'est une règle absolue du langage Javascript.** Mais il faut comprendre *pourquoi*.

En JavaScript, absolument **TOUTES** les valeurs (chaînes, nombres, objets) peuvent être converties en vrai (`true`) ou faux (`false`). 

### Les valeurs "Falsy" (Fausse)
Il n'existe que **6 valeurs** dans tout JavaScript qui sont considérées comme "Falsy" (fausses par nature) :
1. `false` (le booléen lui-même)
2. `0` (le chiffre zéro)
3. `""` ou `''` (une chaîne de caractères complètement vide)
4. `null` (l'absence volontaire de valeur)
5. `undefined` (une variable non initialisée)
6. `NaN` (Not a Number)

### Les valeurs "Truthy" (Vraie)
Absolument **TOUTES les autres valeurs** existantes sont considérées comme "Truthy" (vraies par nature). Par exemple :
- `"bonjour"` (une chaîne non vide)
- `"0"` (une chaîne qui contient un zéro)
- `42` (un nombre autre que zéro)
- `[]` (un tableau, même vide !)
- `{}` (un objet, même vide !)

### Comment agit le `!` (NOT) ?
Le `!` regarde la valeur à sa droite, détermine si elle est Truthy ou Falsy, puis renvoie **le booléen strictement inverse**.

**Exemple 1 : Avec une String (`"mon_token_jwt"`)**
- `"mon_token_jwt"` est une chaîne non vide. Elle est donc **Truthy**.
- Si on fait `!"mon_token_jwt"`, le `!` voit du Truthy, il l'inverse en vrai booléen, ça devient donc `false`.

**Exemple 2 : Avec `null`**
- `null` fait partie des 6 valeurs **Falsy**.
- Si on fait `!null`, le `!` voit du Falsy, il l'inverse, ça devient donc `true`.

### Pourquoi utilise-t-on DEUX points d'exclamation `!!` ?
Parce que le premier `!` nous donne l'inverse de ce qu'on veut, mais il nous garantit que le résultat est un vrai Booléen (`true` ou `false`).
Le deuxième `!` vient simplement remettre ce Booléen dans le bon sens !

- **Si j'ai un token :**
  - Valeur de départ : `"mon_token"` (Truthy)
  - 1er bang `!"mon_token"` ➔ `false`
  - 2ème bang `!false` ➔ `true` (Parfait, je suis connecté !)

- **Si je n'ai PAS de token :**
  - Valeur de départ : `null` (Falsy)
  - 1er bang `!null` ➔ `true`
  - 2ème bang `!true` ➔ `false` (Parfait, je ne suis pas connecté !)

C'est pour cela que `!!` est l'astuce ultime des développeurs JavaScript pour s'assurer qu'une variable devient un booléen strict (`true` ou `false`), sans avoir besoin d'écrire un `if (valeur !== null && valeur !== "")`.

---

## 12. L'Architecture Senior : Clean Code & Custom Hooks

Un composant "Junior" fait tout : il récupère la donnée, gère les clics, et écrit le HTML. C'est ce qu'on appelle un **God Component** (un composant divin qui sait tout faire). C'est impossible à maintenir en entreprise.

**Le Pattern Senior : La Séparation des Préoccupations (Separation of Concerns)**
Nous avons refondu le `Dashboard.jsx` pour appliquer cette règle d'or.

### Étape 1 : Isoler la logique métier dans un Custom Hook (`useArticles.js`)
Toute la logique Redux (`useSelector`, `useDispatch`), la pagination, et la gestion de la suppression ont été extraites dans un fichier à part appelé **Custom Hook**.
- **Avantage :** La logique est réutilisable partout. Le Hook agit comme le "Cerveau". Il prend l'ID de l'espace, réfléchit, et ne retourne que le strict minimum (les variables prêtes à l'emploi).

### Étape 2 : Créer des "Dumb Components" (`ArticleCard.jsx`)
Les composants UI (l'affichage de la carte article, les boutons de pagination) sont extraits dans des composants "Stupides" (Dumb Components).
- **Règle :** Un Dumb Component ne fait AUCUN appel API et n'utilise pas Redux. Il ne fait qu'afficher ce qu'on lui donne (via les `props`).
- **Avantage :** Testabilité parfaite. On peut afficher une `ArticleCard` n'importe où, avec n'importe quelle donnée.

### Étape 3 : Le Composant "Smart" affiné (`Dashboard.jsx`)
Le `Dashboard.jsx` devient un simple chef d'orchestre. Il appelle le cerveau (`useArticles`) pour avoir la donnée, et il la donne aux musiciens (`ArticleCard`) pour la jouer. Le code passe de 220 lignes à 70 lignes. C'est ça, le Clean Code.

---

## 13. Les Intercepteurs de Réponse (Sécurité Passive)

Dans `api.js`, nous utilisions un **Request Interceptor** pour mettre le jeton JWT dans le sac à dos (Header) avant le départ vers le Backend. Mais que se passe-t-il si ce jeton a expiré ?

**Le Problème :**
Le frontend voit toujours le jeton dans le `localStorage`. Le `AuthGuard` (Le Videur à l'entrée) te laisse donc entrer. Mais à chaque fois que tu vas vouloir faire une action, le Backend va te répondre une erreur 401 (Unauthorized).

**La Solution Senior : Le Response Interceptor**
On ajoute un deuxième intercepteur dans Axios, mais cette fois-ci sur la **RÉPONSE**. C'est un filet de sécurité global.
Dès que n'importe quelle requête API revient du serveur avec un statut `401`, l'intercepteur s'en rend compte. Il purge immédiatement le `localStorage` et redirige brutalement l'utilisateur vers la page `/login`.
Cela se fait de manière totalement transparente pour les composants React. Le `Dashboard` n'a même pas besoin de savoir que le jeton a expiré, Axios gère la crise en coulisses !

### 13.1 Le secret de la syntaxe `.use()` (Les Callbacks)

Quand on regarde le code de l'intercepteur de réponse :
```javascript
api.interceptors.response.use(
    (response) => { return response; }, // Fonction 1
    (error) => { ... }                  // Fonction 2
);
```
Il est normal d'être confus car **il n'y a pas de condition `if/else` visible**. On ne voit pas pourquoi le code entre dans la fonction 1 ou dans la fonction 2.

**L'explication :** Le `if/else` est caché à l'intérieur du code source de la librairie Axios !
La fonction `.use()` obéit à une règle stricte, codée en dur (similaire au fonctionnement des `Promise` natives en JavaScript) :
- Axios exécutera **TOUJOURS la première fonction** si le statut HTTP renvoyé par le backend est un **Succès (entre 200 et 299)**.
- Axios exécutera **TOUJOURS la deuxième fonction** si le statut HTTP est une **Erreur (4xx ou 5xx)**.

C'est pour cela que la condition n'est pas dans ton code. Tu ne fais que fournir deux enveloppes avec des consignes à Axios (une pour la réussite, une pour l'échec). C'est Axios qui ouvre la bonne enveloppe selon la réponse du serveur.

**Pourquoi écrit-on `return response;` dans la première fonction ?**
Un intercepteur est un "péage" sur l'autoroute des données. Si tu ne fais pas `return response;`, la donnée est détruite au péage ! Le composant React qui attendait les données va recevoir `undefined` et planter. Ce `return` lève la barrière du péage et laisse la réponse poursuivre sa route jusqu'au composant.
