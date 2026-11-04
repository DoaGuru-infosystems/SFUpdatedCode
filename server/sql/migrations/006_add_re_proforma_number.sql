-- Migration 006: Add re_proforma_number to re_synced_projects
-- Additive only, backward-compatible, default NULL

ALTER TABLE `re_synced_projects`
  ADD COLUMN IF NOT EXISTS `re_proforma_number` VARCHAR(50) DEFAULT NULL AFTER `re_proforma_id`;

