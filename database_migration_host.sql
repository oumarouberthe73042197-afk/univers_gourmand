SET @migration_sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
  ),
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `email` VARCHAR(254) DEFAULT NULL'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  ),
  'SELECT 1',
  'ALTER TABLE `users` ADD UNIQUE KEY `uq_users_email` (`email`(190))'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
  ),
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `role` ENUM(''admin'', ''user'') NOT NULL DEFAULT ''user'''
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_authorized'
  ),
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `is_authorized` BOOLEAN NOT NULL DEFAULT FALSE'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE `users`
SET `email` = `username`
WHERE `email` IS NULL
  AND `username` REGEXP '^[^@ ]+@[^@ ]+[.][^@ ]+$';

UPDATE `users`
SET `role` = 'admin', `is_authorized` = TRUE
WHERE `id` = (
  SELECT `id`
  FROM (SELECT `id` FROM `users` ORDER BY `id` ASC LIMIT 1) AS `first_user`
);

CREATE TABLE IF NOT EXISTS `app_state` (
  `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  `state_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
