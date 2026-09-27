-- 📘 SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES
-- Ce fichier contient l'architecture de notre base de données.
-- C'est un modèle RBAC (Role-Based Access Control) appliqué par "Espace".

-- 1. Création et sélection de la base de données
CREATE DATABASE IF NOT EXISTS blog_db;
USE blog_db;

-- 2. Suppression des tables existantes (pour pouvoir relancer le script de zéro si besoin)
-- L'ordre de suppression est important à cause des clés étrangères. On supprime d'abord les "Enfants" puis les "Parents".
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS user_spaces;
DROP TABLE IF EXISTS spaces;
DROP TABLE IF EXISTS users;

-- ==========================================
-- 3. CRÉATION DES TABLES
-- ==========================================

-- Table USERS : Les comptes de notre application
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- On ne stocke JAMAIS les mots de passe en clair !
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table SPACES : Les "Espaces" de blog (ex: Tech, Voyage, Cuisine...)
CREATE TABLE spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table USER_SPACES : La table pivot (Jointure) pour notre système de rôles (RBAC)
-- Elle répond à la question : "Quel rôle possède cet utilisateur dans cet espace précis ?"
CREATE TABLE user_spaces (
    user_id INT NOT NULL,
    space_id INT NOT NULL,
    role ENUM('Admin', 'Contributor', 'Reader') NOT NULL DEFAULT 'Reader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- La combinaison User + Espace doit être unique (un user n'a qu'un rôle par espace)
    PRIMARY KEY (user_id, space_id),
    
    -- Clés étrangères (Foreign Keys) : 
    -- 'ON DELETE CASCADE' signifie que si on supprime un utilisateur, 
    -- on supprime automatiquement ses droits dans cette table.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table ARTICLES : Le cœur de notre application (Les posts de blog)
-- --------------------------------------------------------
CREATE TABLE articles (
    -- L'identifiant unique de chaque article. 'AUTO_INCREMENT' fait que MySQL compte tout seul (1, 2, 3...)
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Le titre de l'article (VARCHAR(255) limite la taille à 255 caractères)
    title VARCHAR(255) NOT NULL,
    
    -- Le corps de l'article (TEXT permet d'écrire de très longs textes)
    content TEXT NOT NULL,
    
    -- L'image de couverture. On ne stocke pas la vraie image dans MySQL, juste son lien URL texte !
    -- Ce champ sera rempli plus tard par notre API externe (Picsum Photos).
    cover_image_url VARCHAR(255), 
    
    -- RELATIONS (C'est ici qu'on lie les tables entre elles pour faire du Relationnel)
    -- 1. Qui a écrit cet article ? On stocke l'ID de l'auteur.
    author_id INT NOT NULL,
    
    -- 2. Dans quelle catégorie (Espace) est publié cet article ?
    space_id INT NOT NULL,
    
    -- Date de création. Remplie automatiquement par MySQL lors de la création grâce à 'DEFAULT CURRENT_TIMESTAMP'.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Date de dernière modification. Magique : MySQL la met à jour tout seul à chaque fois que tu fais un 'UPDATE' !
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- CLÉS ÉTRANGÈRES (Les ponts de sécurité stricts entre les tables)
    -- 'ON DELETE CASCADE' est une sécurité absolue pour éviter les "données fantômes" : 
    -- Si l'utilisateur ID 5 supprime son compte de la table 'users', 
    -- MySQL va détruire automatiquement et instantanément tous ses articles ici !
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- De même, si un Espace est supprimé, tous les articles contenus à l'intérieur disparaissent proprement.
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. INSERTION DE DONNÉES DE TEST (SEED)
-- ==========================================
-- Création d'utilisateurs fictifs
INSERT INTO users (email, password_hash) VALUES 
('alice@example.com', 'faux_hash_123'), 
('bob@example.com', 'faux_hash_456');

-- Création d'espaces de test
INSERT INTO spaces (name, description) VALUES 
('Tech Blog', 'Toutes les actualités Tech'), 
('Lifestyle', 'Voyages et bien-être');

-- Attribution des rôles
-- Alice est 'Admin' de la Tech, mais juste 'Reader' sur le Lifestyle
INSERT INTO user_spaces (user_id, space_id, role) VALUES (1, 1, 'Admin');
INSERT INTO user_spaces (user_id, space_id, role) VALUES (1, 2, 'Reader');

-- Bob est 'Contributor' (Rédacteur) sur la Tech, et il n'a pas accès au Lifestyle
INSERT INTO user_spaces (user_id, space_id, role) VALUES (2, 1, 'Contributor');

-- Création de 2 articles factices pour l'Espace 'Tech Blog' (space_id = 1)
-- L'auteur est Bob (author_id = 2) qui a le droit d'écrire car il a le rôle Contributor !
-- (Note de syntaxe SQL : On met un double apostrophe '' pour échapper un apostrophe dans un texte)
INSERT INTO articles (title, content, author_id, space_id) VALUES 
('L''Intelligence Artificielle en 2026', 'Voici mon tout premier article sur le futur de la technologie...', 2, 1),
('React vs Vue', 'Un débat sans fin entre développeurs, mais tellement intéressant !', 2, 1);
