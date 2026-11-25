<?php
declare(strict_types=1);

function databaseConnection(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $config = require __DIR__ . '/config.php';

    $connection = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4",
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $connection;
}

/**
 * Crée la table des commandes passées par les clients (QR code) si elle n'existe pas encore.
 * Appelée automatiquement : aucune migration manuelle n'est nécessaire.
 */
function ensureCustomerOrdersSchema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    try {
        $pdo->query('SELECT 1 FROM `customer_orders` LIMIT 0');
        $done = true;
        return;
    } catch (PDOException $exception) {
        // Table absente : on la crée ci-dessous.
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `customer_orders` (
          `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          `public_token` CHAR(32) NOT NULL,
          `table_number` INT UNSIGNED NOT NULL,
          `customer_name` VARCHAR(80) DEFAULT NULL,
          `items_json` TEXT NOT NULL,
          `items_label` VARCHAR(500) NOT NULL,
          `total` DECIMAL(12, 2) NOT NULL,
          `status` ENUM('preparation', 'pret', 'servi', 'paye') NOT NULL DEFAULT 'preparation',
          `payment_method` ENUM('orange', 'wave', 'moov') DEFAULT NULL,
          `payment_status` ENUM('none', 'declared', 'confirmed') NOT NULL DEFAULT 'none',
          `payment_reference` VARCHAR(60) DEFAULT NULL,
          `archived` TINYINT(1) NOT NULL DEFAULT 0,
          `ip_hash` CHAR(16) DEFAULT NULL,
          `created_at` DATETIME NOT NULL,
          `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX `idx_co_status` (`archived`, `status`),
          INDEX `idx_co_created` (`created_at`),
          INDEX `idx_co_ip` (`ip_hash`, `created_at`)
        ) ENGINE=InnoDB AUTO_INCREMENT=2000"
    );
    $done = true;
}
