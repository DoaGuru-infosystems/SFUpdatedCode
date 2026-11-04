-- Migration 007: Create departments table
-- Additive only, formal department entity with TL link and strict deadline tracking flag

CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `tl_employee_id` INT NULL,
  `strict_deadline_tracking` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_departments_tl` FOREIGN KEY (`tl_employee_id`) REFERENCES `task_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

