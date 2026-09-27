## Diagramme C4 - Niveau 2 (Containers)
### Plateforme B2B d'ingestion, qualification IA omnicanale et routage automatique de leads

<!-- 
=============================================================================
🎓 LEÇON D'ARCHITECTE - LA SYNTAXE DES FLÈCHES EN C4 (NIVEAU 2)
=============================================================================
Dans un diagramme C4, le texte sur une flèche ne doit jamais être flou. 
Il doit répondre au "Quoi ?" et au "Comment ?".

L'ordre standard et recommandé sur la flèche est le suivant :
[Action Métier] | [Protocole] / [Format ou Style] / [Sécurité]

EXEMPLES EXHAUSTIFS (Alternatives) :

1. Communication Web / API (Front vers Back ou B2B) :
   - "Envoie des requêtes utilisateur | HTTPS / API REST / JWT" (Le grand classique)
   - "Affiche les données en temps réel | WSS (WebSocket) / JSON / Session Cookie"
   - "Récupère les profils | HTTPS / GraphQL / OAuth2"
   - "Déclenche l'automatisation | HTTPS / Webhook / API Key"

2. Communication Base de Données (App vers DB) :
   - "Sauvegarde le lead | TCP / SQL (Port 3306) / Credential internes" (MySQL/PostgreSQL)
   - "Lit les documents | TCP / Protocole MongoDB"
   - "Stocke le cache | TCP / Protocole Redis (RESP)"

3. Communication Serveur à Serveur (Microservices) :
   - "Déclenche l'action interne | HTTP / gRPC / mTLS"

Pourquoi cet ordre précis ?
- L'Action Métier : Pour que le Product Manager comprenne le but de la flèche.
- Le Protocole : Pour que l'Ingénieur Réseau ouvre les bons pare-feu (ex: TCP 3306, HTTPS 443).
- Le Format : Pour que le Développeur sache comment coder son client (Axios/REST, requêtes SQL).
- La Sécurité : Pour prouver à l'Architecte Sécurité que le flux n'est pas ouvert à tout le monde.

-----------------------------------------------------------------------------
🔄 LEÇON D'ARCHITECTE - LE TYPE DE TRAIT (Pleine vs Pointillée vs Boucle)
-----------------------------------------------------------------------------
1. Flèche pleine [ - - > ] : Protocole Réseau Synchrone (Bloquant).
   Le système A appelle le système B et fige son exécution en attendant la réponse.
   ⚠️ PIÈGE CLASSIQUE : Tous les appels HTTP et HTTPS sont SYNCHRONES par nature (HTTPS est identique à HTTP, juste chiffré). Même si ton Worker tourne en "tâche de fond", lorsqu'il fait un Webhook (HTTPS POST) vers n8n ou le CRM, le réseau est bloqué jusqu'à recevoir la réponse "200 OK". C'est pour cela que les flèches vers n8n et le CRM sont PLEINES !

2. Flèche en pointillés [ - . - > ] : Action Asynchrone ou Événementielle (Pub/Sub).
   Le système écoute passivement un événement ou déclenche une action en tâche de fond, sans bloquer le système (ex: Dépiler un job dans Redis).

3. Flèche avec rotation (Symbole Boucle / Refresh) : Polling ou Retries.
   Représente une mécanique de résilience. Le système interroge une ressource en boucle ("Y a-t-il un nouveau message ?") ou va réessayer automatiquement en cas d'échec (ex: Les "Retries" de BullMQ vers une API externe).

-----------------------------------------------------------------------------
🔗 LEÇON D'ARCHITECTE - LE COUPLAGE (Coupling)
-----------------------------------------------------------------------------
1. Comment le détecter visuellement sur le C4 ? 
   C'est exact ! Dès que tu vois plusieurs flèches (provenant de conteneurs différents) converger vers un SEUL conteneur (ex: API et Worker qui pointent tous les deux vers la même DB MySQL), tu as une zone de "Couplage". 
   La question magique : "Si je modifie la DB (le nom d'une colonne), est-ce que je dois modifier et redéployer l'API ET le Worker ?" Si oui = Couplage fort (Tightly Coupled).

2. Le pattern "Shared Database" (Base partagée) :
   - ACCEPTÉ EN PROD (MVP, startups, petites équipes) : Très pragmatique, rapide à coder. Puisque c'est la même équipe (ou le même dev) qui gère l'API et le Worker, la coordination est facile. (C'est ton cas actuel !)
   - REFUSÉ EN PROD (Scale-ups, grandes équipes) : Strictement interdit en microservices purs. Si l'Équipe A modifie la base de données, le Worker de l'Équipe B va crasher en production. La règle devient : "Chaque service a sa propre base de données".

3. Comment casser ce couplage (Les Solutions Architecturales) ?
   Pour détruire un couplage fort, la règle d'or est : "Une Base de Données appartient à UN SEUL conteneur".
   - Solution A (L'API devient Gardien) : L'API est la seule à lire/écrire dans MySQL. Le Worker n'y touche plus. Quand le Worker a fini son job, il fait un appel réseau "HTTPS PUT /api/leads" vers l'API, qui s'occupe de la DB.
   - Solution B (Database-per-service) : L'API a sa DB MySQL. Le Worker a sa propre DB séparée (ex: MongoDB). Ils se synchronisent via des événements (ex: Kafka ou Redis).

4. Qui doit trancher (Faire le Compromis) ?
   C'est le rôle absolu de l'ARCHITECTE. C'est lui qui fait le "Trade-off". Il choisit d'accepter ce couplage pour aller vite au début du projet, et le documente dans un ADR (Architecture Decision Record) en précisant : "Nous acceptons le Shared Database pour le MVP, mais nous le séparerons quand l'équipe grandira". Le développeur, lui, se contente d'appliquer l'architecture choisie.
=============================================================================
-->

```mermaid
graph TB

    %% 1. Acteurs Humains
    Commercial["👤 Commercial / Équipe Ventes"]
    Lead["👤 Lead / Prospect"]

    %% 2. Couche Client (Frontend)
    subgraph ClientLayer [Couche Client]
      WebApp["📱 Web Application - React.js"]
    end

    %% 3. Système Central (Containers)
    subgraph SysthemeCentrale ["Système Central"]
      API["⚙️ API Backend - Node.js Express"]
      Queue[("📥 QUEUE Asynchrone - Redis / BullMQ")]
      Worker["🧠 WORKER de Traitement LLM - Node.js"]
      DB[("🗄️ DB MySQL")]
      N8n["⚡ Moteur de workflow - n8n Self-Hosted"]
    end
      
    %% 4. Systèmes Externes
    subgraph ExternalSystems [Systèmes Externes]
      Meta_Whatsapp["📱 Meta/Whatsapp"]
      LLM["🤖 LLM (OpenAI / Anthropic)"]
      CRM["🏢 CRM Externe"]
    end


    %% 5. Communication entre containers & protocoles
    
    %% ⚠️ LEÇON D'ARCHITECTE - SÉCURITÉ : 
    %% Un flux externe vers une API doit TOUJOURS préciser son authentification.
    %% Sans ça (ex: JWT, OAuth2), l'architecture est considérée comme non sécurisée "by design".
    WebApp -->| Envoie des requêtes du front vers le back HTTPS / API REST / JWT | API
    
    Lead -->| Envoie du message vers Meta_Whatsapp | Meta_Whatsapp
    Meta_Whatsapp -->| Envoie du message vers la plateforme Webhook / API HTTPS POST | API
    
    %% ⚠️ LEÇON D'ARCHITECTE - COUPLAGE "SHARED DATABASE" :
    %% L'API et le Worker accèdent directement à la même base de données. 
    %% Toléré pour un MVP, mais attention : cela couple fortement les deux services au même schéma SQL.
    API -->| Sauvegarde du message entrant dans la DB TCP / SQL (Port 3306) | DB
    Worker -->| Mise à jour du lead dans la DB avec le résultat LLM TCP / SQL | DB

    API -->| Déléguer les traitements lourds à la queue Redis Protocol / RESP | Queue
    Queue -->| Consommation des jobs des queues BullMQ / Worker Poll | Worker
    
    %% ⚠️ LEÇON D'ARCHITECTE - RÉSILIENCE (CIRCUIT BREAKER) :
    %% Tout appel vers une API Externe (OpenAI, WhatsApp) risque d'échouer (Rate limits dépassés, panne serveur...).
    %% Le pattern "Circuit Breaker" (Coupe-circuit) permet d'arrêter de spammer l'API si elle est "down".
    %% Ça évite que ton Worker ne s'épuise à attendre des Timeouts en boucle. C'est la signature d'un système robuste.
    Worker -->| Envoi du message du lead vers le LLM HTTPS / REST API (avec Circuit Breaker) | LLM
    
    Worker -->| Déclenchement de la réponse vers le prospect HTTPS / REST API (WhatsApp Cloud API / Circuit Breaker) | Meta_Whatsapp
    Meta_Whatsapp -->| Réponse vers le lead HTTPS / REST API (WhatsApp Cloud API) | Lead

    %% ⚠️ LEÇON D'ARCHITECTE - DÉCOUPLAGE D'UN WEBHOOK (PATTERN PUB/SUB) : 
    %% Puisque n8n n'accepte qu'un Webhook en entrée dans ton architecture (et non un trigger Redis direct), 
    %% faire l'appel HTTP directement depuis la fonction principale du Worker est dangereux (si n8n plante, le lead est perdu car le worker aura termine son taf plus rien n'est sauvegarde apres).
    %% SOLUTION (Pattern Background Job / Asynchrone avec BullMQ) : 
    %% Étape A [PUB - Publisher] : Le Worker principal PUBLIE un job 'webhook_n8n' dans la Queue Redis et termine son traitement instantanément pour eviter perte de donnees si n8n crash derriere d'ou on sauvegarde d'abord dans Redis.
    %% Étape B [SUB - Subscriber] : Un processus d'arrière-plan (Worker BullMQ) est ABONNÉ (Souscrit) à la Queue. Il écoute, dépile le message et exécute l'appel HTTP vers n8n. 
    %% Étape C (Résilience) : Si n8n est indisponible, l'appel HTTP échoue, mais le message reste dans Redis. BullMQ gérera les "retries" automatiques plus tard. Zéro perte !
    
    %% 💡 INFO SYNTAXE MERMAID & MÉCANIQUE DU BACKGROUND JOB : 
    %% Pourquoi le flux repasse par le Worker (Queue -.-> Worker) au lieu de (Queue --> n8n) ?
    %% 1. Redis (la Queue) est "stupide" : c'est un simple stockage, il ne sait pas faire de requêtes HTTP.
    %% 2. La donnée DOIT retourner dans ton code Node.js (tâche de fond) car c'est lui qui a l'intelligence de formater et d'envoyer l'appel HTTP.
    %% "-->" (Flèche pleine) = Le code fait une action active (Pousser un job, faire une requête HTTP).
    %% "-.->" (Flèche pointillée) = Le code écoute passivement et réagit à un événement asynchrone (Dépiler le job depuis Redis).
    
    Worker -->| Étape A [PUB]: Le script principal PUBLIE le job 'webhook_n8n' (Redis Protocol) | Queue
    Queue -.->| Étape B [SUB]: La tâche de fond EST ABONNÉE et dépile le job (BullMQ) | Worker
    Worker -->| Étape C: Déclenche le workflow (Webhook avec retries) HTTPS POST | N8n

    N8n -->| Mise à jour du CRM externe pour l'entreprise HTTPS / REST API | CRM
    N8n -->| Notification instantanée du lead qualifié (Email / Slack / SMS) | Commercial

```
