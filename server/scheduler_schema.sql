-- ============================================================
-- Scheduler Plugin - Tables for SF Database (dilkeris_sf_new)
-- Run this SQL in your MySQL to add scheduler tables
-- NOTE: Uses existing 'user' table as employees reference
-- ============================================================

-- Table: scheduler_reminders
CREATE TABLE IF NOT EXISTS scheduler_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT DEFAULT NULL,
  assignment_type ENUM('self', 'single', 'multiple', 'team') NOT NULL DEFAULT 'self',
  title VARCHAR(255) NOT NULL,
  note TEXT DEFAULT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  repeat_type ENUM('none', 'hourly', 'daily', 'alternate_days', 'weekly', 'monthly', 'custom', 'never_ends') DEFAULT 'none',
  custom_repeat_data JSON DEFAULT NULL,
  remind_before VARCHAR(50) DEFAULT '10_minutes',
  custom_remind_minutes INT DEFAULT NULL,
  delivery_method VARCHAR(50) DEFAULT 'inapp_only',
  message_template TEXT DEFAULT NULL,
  dnd_enabled TINYINT(1) DEFAULT 0,
  dnd_start_time TIME DEFAULT NULL,
  dnd_end_time TIME DEFAULT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  next_trigger_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: scheduler_reminder_employees (many-to-many)
CREATE TABLE IF NOT EXISTS scheduler_reminder_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reminder_id INT NOT NULL,
  employee_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES scheduler_reminders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reminder_emp (reminder_id, employee_id)
);

-- Table: scheduler_notifications
CREATE TABLE IF NOT EXISTS scheduler_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reminder_id INT NOT NULL,
  employee_id INT NOT NULL,
  channel_type ENUM('whatsapp', 'email', 'inapp', 'sms') NOT NULL,
  message_body TEXT NOT NULL,
  delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
  is_read TINYINT(1) DEFAULT 0,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  failure_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES scheduler_reminders(id) ON DELETE CASCADE
);

-- Indexes (using IF NOT EXISTS workaround via stored procedures not needed here)
CREATE INDEX idx_sched_status ON scheduler_reminders(status);
CREATE INDEX idx_sched_trigger ON scheduler_reminders(next_trigger_at);
CREATE INDEX idx_sched_date ON scheduler_reminders(reminder_date);
CREATE INDEX idx_sched_notif_rid ON scheduler_notifications(reminder_id);
CREATE INDEX idx_sched_notif_read ON scheduler_notifications(is_read);
