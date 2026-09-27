// src/middlewares/validateMiddleware.js

/**
 * Middleware Factory pour la validation des données avec Joi.
 * Il intercepte la requête, vérifie si req.body correspond au schéma,
 * et renvoie une erreur 400 Bad Request propre si ce n'est pas le cas.
 * 
 * @param {Object} schema - Le schéma Joi à valider
 */
const validate = (schema) => {
    return (req, res, next) => {
        // On valide req.body contre le schéma Joi
        // abortEarly: false permet de récupérer TOUTES les erreurs d'un coup, pas juste la première.
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            // On transforme le tableau d'erreurs brut de Joi en un tableau de messages propres
            const errorMessages = error.details.map(detail => detail.message);
            
            // On bloque la requête ici avec une erreur HTTP 400 (Bad Request)
            return res.status(400).json({
                error: "Données invalides (Validation échouée)",
                details: errorMessages
            });
        }

        // Si tout est parfait, on autorise le passage au Contrôleur
        next();
    };
};

module.exports = validate;
