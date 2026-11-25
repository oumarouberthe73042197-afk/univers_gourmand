<?php
// Configuration de la base de données.
// Les variables d'environnement UG_DB_* ont la priorité si elles sont définies.
// IMPORTANT : ne publiez jamais ce fichier (dépôt Git public, partage de zip…).
return [
    'host'     => getenv('UG_DB_HOST') ?: 'localhost',
    'database' => getenv('UG_DB_NAME') ?: 'univers_gourmand2',
    'username' => getenv('UG_DB_USER') ?: 'root',
    'password' => getenv('UG_DB_PASSWORD') ?: '',
];
