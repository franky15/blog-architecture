## Plateforme B2B d'ingestion, qualification IA omnicanale et routage automatique de leads

## scenario le prospect ecrit un message via whatsapp puis meta/whatsapp envoie les msg a notre plateforme (api rest) ,puis l'api envoie le message a notre bot (chatbot llm openrouter/openai/anthropic/gemini) notre bot recoit et repond aux messages entrants du prospect pour qualifier le lead , dès que le lead est qualifié il est crée selon son statut, s'il est qualifié,perdu.


## Extraction d'information on sait que dans c4 niveau 1 on doit identifier :

# les acteurs (commercial,Prospect)

## les sytemes tiers(Meta/Whatsapp, llm,)

## le systeme centrale(plateforme d'ingestion de lead)


```mermaid
graph TD
    %% 1. Définition des Acteurs (Humains / Personas) representé par une carte 
    prospects["👤 Prospects"]
    commercial["👤Le commercial"]

    %% 2. Définition du Système Central (Considéré comme une boîte noire) representé par une carte
    plateforme_ingestion_lead["📱 Plateforme d'ingestion de lead"]
    
    %% 3. Définition des Systèmes Tiers (Services externes) representé par une carte
    Meta_Whatsapp["📱 Meta/Whatsapp"]
    LLM["🤖 LLM"]
    
    %% 4. Trace des flux et relations métier (Actions haut niveau) chaque element est representé par une fleche et chaque relation est etiqueté par une description
    prospects -->|envoie un msg sur whatsapp| Meta_Whatsapp
    Meta_Whatsapp -->|envoie les msg a notre plateforme| plateforme_ingestion_lead
    plateforme_ingestion_lead -->|envoie le message a notre bot| LLM
    LLM -->|repond au message et renvoie la qualification du lead| plateforme_ingestion_lead
    plateforme_ingestion_lead -->|cree le lead selon son statut et envoie le message whatsapp au prospect| Meta_Whatsapp
    plateforme_ingestion_lead -->|envoie la notification de qualification et le bilan de session a Meta/Whatsapp| Meta_Whatsapp
    Meta_Whatsapp -->|délivre la notification de qualification et le bilan au commercial| commercial

```

