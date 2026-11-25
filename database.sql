CREATE TABLE IF NOT EXISTS `restaurant_settings` (
  `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `opening_time` TIME NOT NULL,
  `closing_time` TIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(190) NOT NULL UNIQUE,
  `email` VARCHAR(254) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `is_authorized` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_users_email` (`email`(190))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `menu_dishes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `available` BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `table_number` INT UNSIGNED NOT NULL PRIMARY KEY,
  `seats` TINYINT UNSIGNED NOT NULL,
  `status` ENUM('free', 'occupied') NOT NULL DEFAULT 'free'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  `table_number` INT UNSIGNED NOT NULL,
  `items` TEXT NOT NULL,
  `total` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('preparation', 'pret', 'servi', 'paye') NOT NULL DEFAULT 'preparation',
  `order_date` DATE NOT NULL,
  `order_time` TIME NOT NULL,
  CONSTRAINT `fk_orders_restaurant_table`
    FOREIGN KEY (`table_number`) REFERENCES `restaurant_tables` (`table_number`),
  INDEX `idx_orders_status_date` (`status`, `order_date`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(30) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `alert_threshold` DECIMAL(10, 2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(180) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `recurring` BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX `idx_expenses_date` (`expense_date`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `app_state` (
  `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  `state_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO `restaurant_settings`
  (`id`, `name`, `address`, `phone`, `opening_time`, `closing_time`)
VALUES
  (1, 'Univers Gourmand', 'Abidjan, Côte d’Ivoire', '+225 07 00 00 00', '11:30:00', '22:30:00');

INSERT IGNORE INTO `menu_dishes` (`id`, `name`, `category`, `price`, `available`) VALUES
  (1, 'Bœuf bourguignon', 'Plats', 9500, TRUE),
  (2, 'Tartelette aux légumes', 'Entrées', 4500, TRUE),
  (3, 'Saumon rôti', 'Plats', 8000, TRUE),
  (4, 'Velouté de potimarron', 'Entrées', 3500, FALSE),
  (5, 'Canard confit', 'Plats', 9000, TRUE),
  (6, 'Tarte citron meringuée', 'Desserts', 3000, TRUE);

INSERT IGNORE INTO `restaurant_tables` (`table_number`, `seats`, `status`) VALUES
  (1, 2, 'free'),
  (2, 4, 'occupied'),
  (3, 4, 'free'),
  (4, 2, 'free'),
  (5, 6, 'occupied'),
  (6, 2, 'free'),
  (7, 4, 'occupied'),
  (8, 4, 'occupied'),
  (9, 2, 'free'),
  (10, 6, 'free'),
  (11, 4, 'free'),
  (12, 4, 'occupied');

INSERT IGNORE INTO `orders`
  (`id`, `table_number`, `items`, `total`, `status`, `order_date`, `order_time`)
VALUES
  (1048, 12, 'Bœuf bourguignon ×2', 19000, 'preparation', '2026-11-19', '12:42:00'),
  (1047, 5, 'Saumon rôti ×1, Tartelette ×2', 17000, 'servi', '2026-11-19', '12:38:00'),
  (1046, 8, 'Canard confit ×2', 18000, 'preparation', '2026-11-19', '12:31:00'),
  (1045, 3, 'Menu du jour ×2', 16000, 'paye', '2026-11-19', '12:18:00');

INSERT IGNORE INTO `stock_items` (`id`, `name`, `unit`, `quantity`, `alert_threshold`) VALUES
  (1, 'Tomates', 'kg', 18, 10),
  (2, 'Saumon', 'kg', 3.5, 5),
  (3, 'Bœuf', 'kg', 7, 8),
  (4, 'Pommes de terre', 'kg', 26, 12),
  (5, 'Huile d’olive', 'L', 6, 4),
  (6, 'Farine', 'kg', 14, 6);

INSERT IGNORE INTO `expenses`
  (`id`, `label`, `category`, `amount`, `expense_date`, `recurring`)
VALUES
  (1, 'Loyer du local', 'Coûts fixes', 350000, '2026-11-01', TRUE),
  (2, 'Salaires du personnel', 'Coûts fixes', 420000, '2026-11-05', TRUE),
  (3, 'Électricité', 'Services publics', 95000, '2026-11-08', TRUE),
  (4, 'Eau', 'Services publics', 28000, '2026-11-09', TRUE),
  (5, 'Internet et téléphone', 'Coûts fixes', 35000, '2026-11-10', TRUE),
  (6, 'Achats de produits frais', 'Coûts variables', 185000, '2026-11-11', FALSE),
  (7, 'Livraison fournisseur', 'Coûts variables', 24000, '2026-11-12', FALSE),
  (8, 'Entretien cuisine', 'Maintenance', 45000, '2026-11-13', FALSE),
  (9, 'Publicité réseaux sociaux', 'Marketing', 60000, '2026-11-14', FALSE),
  (10, 'Emballages à emporter', 'Coûts variables', 32000, '2026-11-15', FALSE);

-- Commandes envoyées par les clients depuis le QR code (créée aussi automatiquement par l'application).
CREATE TABLE IF NOT EXISTS `customer_orders` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2000;
