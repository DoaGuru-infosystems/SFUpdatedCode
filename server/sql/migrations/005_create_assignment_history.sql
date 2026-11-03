-- Phase 5 Migration: Create assignment_history table for task/project owner audit trail
CREATE TABLE IF NOT EXISTS `assignment_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `entity_type` ENUM('task_owner','project_owner') NOT NULL,
  `entity_id` INT(11) NOT NULL,
  `project_id` INT(11) NOT NULL,
  `old_employee_id` INT(11) DEFAULT NULL,
  `new_employee_id` INT(11) NOT NULL,
  `changed_by` INT(11) NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_new_employee` (`new_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

