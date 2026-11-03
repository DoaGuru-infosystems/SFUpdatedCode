-- ============================================================
-- Migration 001: RE Integration Tables
-- Purpose: Add tables to receive project.assigned events from
--          Revenue Engine (RE). Additive only — no existing
--          table is altered or renamed.
-- Run:  mysql -u root -p dilkeris_sf < server/sql/migrations/001_re_integration_tables.sql
-- Or:   node server/sql/migrations/run_001_migration.js
-- ============================================================

-- 1. Tracks a project that originated from RE, linked to local `projects` row
CREATE TABLE IF NOT EXISTS `re_synced_projects` (
  `id`                  INT(11)       NOT NULL AUTO_INCREMENT,
  `project_id`          INT(11)       NOT NULL,
  `re_proforma_id`      INT(11)       NOT NULL,
  `re_idempotency_key`  VARCHAR(255)  NOT NULL,
  `client_name`         VARCHAR(255)  DEFAULT NULL,
  `start_date`          DATE          DEFAULT NULL,
  `end_date`            DATE          DEFAULT NULL,
  `is_active`           TINYINT(1)    DEFAULT 1,
  `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proforma`      (`re_proforma_id`),
  UNIQUE KEY `uq_idempotency`   (`re_idempotency_key`),
  CONSTRAINT `fk_rsp_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Contextual role: Project Owner for ONE project only, base role untouched
CREATE TABLE IF NOT EXISTS `project_owners` (
  `id`          INT(11)                     NOT NULL AUTO_INCREMENT,
  `project_id`  INT(11)                     NOT NULL,
  `employee_id` INT(11)                     NOT NULL,
  `assigned_by` INT(11)                     NOT NULL,
  `status`      ENUM('active','removed')    DEFAULT 'active',
  `created_at`  TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proj_emp` (`project_id`, `employee_id`),
  CONSTRAINT `fk_po_project`
    FOREIGN KEY (`project_id`)  REFERENCES `projects`   (`id`),
  CONSTRAINT `fk_po_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `task_users`  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Service-item tasks imported from RE (linked to local tasks concept)
CREATE TABLE IF NOT EXISTS `task_owners` (
  `id`            INT(11)       NOT NULL AUTO_INCREMENT,
  `project_id`    INT(11)       NOT NULL,
  `sf_task_id`    VARCHAR(50)   DEFAULT NULL  COMMENT 'Human-readable ID e.g. SF-T42',
  `re_item_name`  VARCHAR(255)  NOT NULL,
  `category`      VARCHAR(100)  DEFAULT NULL,
  `description`   TEXT          DEFAULT NULL,
  `quantity`      INT(11)       DEFAULT NULL,
  `status`        ENUM('pending','in_progress','completed') DEFAULT 'pending',
  `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_to_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Back-fill sf_task_id for any rows inserted without it
UPDATE `task_owners`
SET    `sf_task_id` = CONCAT('SF-T', `id`)
WHERE  `sf_task_id` IS NULL;

