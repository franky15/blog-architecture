// src/validators/articleSchema.js

// 📘 POURQUOI CE FICHIER ? (La Philosophie de la Validation)
// 1. Pourquoi faire ça côté Backend alors que le Frontend (React/Vue) le fait déjà ?
//    Parce que "Never trust the client" (Ne fais jamais confiance au client). Le Frontend valide pour le CONFORT (UX).
//    Le Backend valide pour la SÉCURITÉ. N'importe qui peut contourner ton Frontend via Postman ou un script Python.
//    Si le Backend ne valide pas, on s'expose à des crashs SQL (textes trop longs) ou des failles de sécurité (XSS, Injection).
// 
// 2. Pourquoi utiliser un Middleware (Joi) au lieu de mettre des "if (!title)" dans le Controller ?
//    - SÉPARATION DES TÂCHES : Le métier d'un Contrôleur est de parler à la BDD, pas de compter des caractères.
//    - ROBUSTESSE : Un simple "if (!title)" vérifie juste si la variable existe. Il ne vérifie pas si un pirate a envoyé un tableau "[]" au lieu d'une string, ce qui ferait planter le code plus tard.
//    - FAIL FAST (Échouer vite) : En bloquant la requête dans le Routeur, on n'alloue aucune ressource au Contrôleur. On rejette la mauvaise donnée instantanément avec un code HTTP 400.

const Joi = require('joi');

// 💡 SCHEMA DE CRÉATION D'UN ARTICLE
// Définit les règles strictes que doit respecter le JSON envoyé par le client (req.body)
const createArticleSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(150)
        .required()
        .messages({
            'string.base': `Le titre doit être du texte.`,
            'string.empty': `Le titre ne peut pas être vide.`,
            'string.min': `Le titre doit faire au moins {#limit} caractères.`,
            'string.max': `Le titre ne doit pas dépasser {#limit} caractères.`,
            'any.required': `Le champ 'title' est obligatoire.`
        }),
        
    content: Joi.string()
        .min(20)
        .required()
        .messages({
            'string.empty': `Le contenu de l'article ne peut pas être vide.`,
            'string.min': `Le contenu est trop court (minimum {#limit} caractères).`,
            'any.required': `Le champ 'content' est obligatoire.`
        }),
        
    cover_image_url: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': `L'URL de l'image de couverture n'est pas un lien valide.`
        })
});

// 💡 SCHEMA DE MODIFICATION (PUT)
// Souvent très similaire à la création, mais on pourrait rendre certains champs optionnels.
// Ici, on va utiliser le même niveau d'exigence que la création.
const updateArticleSchema = createArticleSchema;

module.exports = {
    createArticleSchema,
    updateArticleSchema
};
