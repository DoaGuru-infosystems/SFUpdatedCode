-- Migration 009: Stable RE item identity and soft hiding for synced tasks.
-- Repeated NULL re_item_id values are allowed for rows created before
-- project.updated synchronization is enabled.

ALTER TABLE `task_owners`
  ADD COLUMN IF NOT EXISTS `re_item_id` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `is_hidden` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `hidden_at` TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE `task_owners`
  ADD UNIQUE KEY `uq_task_owners_project_re_item` (`project_id`, `re_item_id`);
