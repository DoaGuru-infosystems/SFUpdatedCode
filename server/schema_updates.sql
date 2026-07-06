CREATE TABLE IF NOT EXISTS `comp_offs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `earned_date` DATE NOT NULL,
  `day_type` ENUM('full', 'half') NOT NULL DEFAULT 'full',
  `status` ENUM('available', 'used') NOT NULL DEFAULT 'available',
  `used_against_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `employee_id_idx` (`employee_id`),
  KEY `status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
