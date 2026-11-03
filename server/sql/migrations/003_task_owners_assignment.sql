-- ============================================================
-- Migration 003: Add Assignment Columns to task_owners
-- Purpose: Enable Task Owner assignments (employee_id, assigned_by,
--          deadline) and review status. Additive only.
-- Run:  mysql -u root -p dilkeris_sf < server/sql/migrations/003_task_owners_assignment.sql
-- Or:   node server/sql/migrations/run_003_migration.js
-- ============================================================

ALTER TABLE `task_owners`
  ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `employee_id` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `assigned_by` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `deadline` DATE DEFAULT NULL,
  MODIFY COLUMN `status` ENUM('pending','in_progress','review','completed') DEFAULT 'pending';

