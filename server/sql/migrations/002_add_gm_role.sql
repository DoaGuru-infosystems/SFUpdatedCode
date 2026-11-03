-- ============================================================
-- Migration 002: Add 'gm' Role to admin_users
-- Purpose: Introduce an explicit 'gm' role value alongside
--          existing 'admin' and 'manager' roles. Additive only.
-- Run:  mysql -u root -p dilkeris_sf < server/sql/migrations/002_add_gm_role.sql
-- Or:   node server/sql/migrations/run_002_migration.js
-- ============================================================

ALTER TABLE `admin_users`
  MODIFY COLUMN `role` ENUM('admin','manager','gm') NOT NULL DEFAULT 'manager';

