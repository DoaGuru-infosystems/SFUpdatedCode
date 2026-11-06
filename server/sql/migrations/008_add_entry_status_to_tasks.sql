-- ============================================================
-- Migration 008: Add entry_status column to tasks table
-- Purpose: Store permanent, immutable per-entry status snapshot
--          when an employee logs progress against an RE task.
-- ============================================================

ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `entry_status` VARCHAR(50) DEFAULT NULL AFTER `task_owners_id`;

