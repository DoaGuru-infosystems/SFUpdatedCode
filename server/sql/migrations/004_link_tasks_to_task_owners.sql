-- ============================================================
-- Migration 004: Link daily task entries to task_owners
-- Purpose: Add task_owners_id to tasks table for linking
--          daily logs to Revenue Engine service-item tasks.
--          Additive and nullable.
-- Run:  mysql -u root -p dilkeris_sf < server/sql/migrations/004_link_tasks_to_task_owners.sql
-- Or:   node server/sql/migrations/run_004_migration.js
-- ============================================================

ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `task_owners_id` INT(11) DEFAULT NULL AFTER `user_id`;

