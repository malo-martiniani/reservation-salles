-- Création de la base de données
CREATE DATABASE IF NOT EXISTS reservation_salles;
USE reservation_salles;
-- Table users
CREATE TABLE users (
id INT PRIMARY KEY AUTO_INCREMENT,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Table reservations
CREATE TABLE reservations (
id INT PRIMARY KEY AUTO_INCREMENT,
titre VARCHAR(255) NOT NULL,
description TEXT,
debut DATETIME NOT NULL,
fin DATETIME NOT NULL,
user_id INT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE
);
-- Pour exécuter le script : mysql -u root -p < backend/schema.sql