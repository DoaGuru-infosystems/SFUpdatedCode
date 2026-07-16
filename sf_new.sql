-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 08, 2026 at 02:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sf_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_user`
--

CREATE TABLE `admin_user` (
  `id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `role` enum('admin','manager') NOT NULL DEFAULT 'manager',
  `full_name` varchar(255) DEFAULT NULL,
  `email_id` varchar(255) NOT NULL,
  `admin_number` varchar(100) DEFAULT NULL,
  `designation` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assigned_projects`
--

CREATE TABLE `assigned_projects` (
  `id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assigntarget`
--

CREATE TABLE `assigntarget` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) NOT NULL,
  `projectId` int(11) NOT NULL,
  `month` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` year(4) NOT NULL,
  `targetPost` int(11) DEFAULT 0,
  `targetVideo` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `targetShoot` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assign_development_tasks`
--

CREATE TABLE `assign_development_tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_or_client_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','In Progress','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `task_date` date NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attend_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `login_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_selfie_url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_latitude` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_longitude` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_selfie_url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_latitude` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_longitude` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_minutes` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `day_status` enum('full','half','absent','leave','weekend_served','logged-in') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'logged-in',
  `attend_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_created_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_backdate_requests`
--

CREATE TABLE `attendance_backdate_requests` (
  `request_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `request_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abr_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `abr_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `requested_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `request_type` enum('backdate','edit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'backdate',
  `requested_login_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_logout_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attend_leaves`
--

CREATE TABLE `attend_leaves` (
  `leave_id` int(11) NOT NULL,
  `leave_user_id` int(11) NOT NULL,
  `leave_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leave_duration` enum('fullday','halfday') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fullday',
  `leave_type` enum('Sick Leave','Casual Leave','Paid Leave','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `leave_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leave_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `applied_at_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `creative_counts`
--

CREATE TABLE `creative_counts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `creative` int(11) DEFAULT 0,
  `video` int(11) DEFAULT 0,
  `flyer` int(11) DEFAULT 0,
  `other` int(11) DEFAULT 0,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_notifications`
--

CREATE TABLE `email_notifications` (
  `en_id` int(11) NOT NULL,
  `en_user_id` int(11) NOT NULL,
  `type_notification` enum('login_reminder','logout_reminder','leave_approved','leave_rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `en_status` enum('send','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `en_created_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_commitments`
--

CREATE TABLE `employee_commitments` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `commitment_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_notifications`
--

CREATE TABLE `employee_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('leave','attendance','system','reminder') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_salary`
--

CREATE TABLE `emp_salary` (
  `salary_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `salary_amount` int(11) NOT NULL,
  `salary_created_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_updated_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_records`
--

CREATE TABLE `expense_records` (
  `id` int(11) NOT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experincel`
--

CREATE TABLE `experincel` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `joining_date` varchar(255) NOT NULL,
  `resignation_date` varchar(255) NOT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `followupreport`
--

CREATE TABLE `followupreport` (
  `report_id` int(11) NOT NULL,
  `lead_Id` int(11) DEFAULT NULL,
  `u_Id` int(11) DEFAULT NULL,
  `followUpDate` varchar(255) DEFAULT NULL,
  `followUpPhase` varchar(255) DEFAULT NULL,
  `followUpReport` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `genrate_letters`
--

CREATE TABLE `genrate_letters` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `letter_type` varchar(200) NOT NULL,
  `Date` varchar(200) NOT NULL,
  `designation` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internship_offers`
--

CREATE TABLE `internship_offers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `position` varchar(255) NOT NULL,
  `startDate` varchar(255) NOT NULL,
  `endDate` varchar(255) NOT NULL,
  `stipend` varchar(255) NOT NULL,
  `mentorName` varchar(255) NOT NULL,
  `mentorContact` varchar(255) NOT NULL,
  `signatory` varchar(100) DEFAULT NULL,
  `termsAndConditions` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `intern_experience_letters`
--

CREATE TABLE `intern_experience_letters` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeId` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `intern_ppo_letters`
--

CREATE TABLE `intern_ppo_letters` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeId` varchar(255) DEFAULT NULL,
  `oldDesignation` varchar(255) DEFAULT NULL,
  `newDesignation` varchar(255) DEFAULT NULL,
  `newCTC` float DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `basic_salary` float DEFAULT NULL,
  `hra` float DEFAULT NULL,
  `allowances` float DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `lead_Id` int(11) NOT NULL,
  `u_Id` int(11) DEFAULT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `mobileNo` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `date` date NOT NULL DEFAULT curdate(),
  `address` varchar(255) DEFAULT NULL,
  `inquiryType` varchar(255) DEFAULT NULL,
  `nextFollowDate` varchar(255) DEFAULT NULL,
  `nextFollowPhase` varchar(255) DEFAULT NULL,
  `remind` varchar(255) DEFAULT '{   "week": "false",   "yesterday": "false",   "today": "false",   "onehour": "false",   "halfhour": "false" }'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `notify_user_id` int(11) NOT NULL,
  `notification_type` enum('login_reminder','logout_reminder') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notification_status` enum('sent','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notify_created_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `offer_letters`
--

CREATE TABLE `offer_letters` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `offerReleaseDate` varchar(255) NOT NULL,
  `joiningDate` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `salary` varchar(255) NOT NULL,
  `probationPeriod` varchar(255) NOT NULL,
  `noticePeriod` varchar(255) NOT NULL,
  `confirmationNoticePeriod` varchar(255) NOT NULL,
  `jobResponsibilities` text NOT NULL,
  `signatory` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otpcollections`
--

CREATE TABLE `otpcollections` (
  `code_id` int(11) NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  `generated_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paid_holidays`
--

CREATE TABLE `paid_holidays` (
  `hid` int(11) NOT NULL,
  `holiday_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `holiday_created_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  INDEX `idx_projects_department` (`department`),
  INDEX `idx_projects_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `push_subscriptions`
--

INSERT INTO `push_subscriptions` (`id`, `user_id`, `subscription`, `created_at`) VALUES
(169, 1, '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/ctZ9_wjHawc:APA91bEnjaLSILzKA_7aUVXrz85XjA9dLdwRtnz3xwoHqGb_QPe5Uihe7smuAGIdGE2h4mVtFLBOohPBD7BrWD-Cqi_cyQdyLy7xM5kWbDJt2bgP5b62UquNI_nXNV2ii8gib-Jx5-T5\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BE51c6jdUCjX2ADjsecNcOmfWXqqFjo4Gz2qBe_G9xRrdNhOOihaNZOpTxlIn71Fa1ou_NzsGoRKeN4Eo14pCl4\",\"auth\":\"WlEPVSQuXKblQ_9iRXtYQg\"}}', '2026-07-08 11:22:22');

-- --------------------------------------------------------

--
-- Table structure for table `relieving_letters`
--

CREATE TABLE `relieving_letters` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `dateOfJoining` date DEFAULT NULL,
  `dateOfRelieving` date DEFAULT NULL,
  `lastWorkingDay` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_payments`
--

CREATE TABLE `salary_payments` (
  `payment_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `total_salary` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `remaining_amount` decimal(10,2) DEFAULT 0.00,
  `payment_duration` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `remaining_paid_date` date DEFAULT NULL,
  `status` enum('Paid','Partial','Pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_slips`
--

CREATE TABLE `salary_slips` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeId` varchar(255) DEFAULT NULL,
  `month` varchar(50) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `grossSalary` float DEFAULT NULL,
  `netSalary` float DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `basic_salary` float DEFAULT NULL,
  `hra` float DEFAULT NULL,
  `pf` float DEFAULT NULL,
  `esi` float DEFAULT NULL,
  `allowances` float DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduler_notifications`
--

CREATE TABLE `scheduler_notifications` (
  `id` int(11) NOT NULL,
  `reminder_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `channel_type` enum('whatsapp','email','inapp','sms') NOT NULL,
  `message_body` text NOT NULL,
  `delivery_status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
  `is_read` tinyint(1) DEFAULT 0,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `failure_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduler_reminders`
--

CREATE TABLE `scheduler_reminders` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `assignment_type` enum('self','single','multiple','team') NOT NULL DEFAULT 'self',
  `title` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `reminder_date` date NOT NULL,
  `reminder_time` time NOT NULL,
  `repeat_type` enum('none','hourly','daily','alternate_days','weekly','monthly','custom','never_ends') DEFAULT 'none',
  `custom_repeat_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_repeat_data`)),
  `remind_before` varchar(50) DEFAULT '10_minutes',
  `custom_remind_minutes` int(11) DEFAULT NULL,
  `delivery_method` varchar(50) DEFAULT 'inapp_only',
  `message_template` text DEFAULT NULL,
  `dnd_enabled` tinyint(1) DEFAULT 0,
  `dnd_start_time` time DEFAULT NULL,
  `dnd_end_time` time DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `next_trigger_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduler_reminder_employees`
--

CREATE TABLE `scheduler_reminder_employees` (
  `id` int(11) NOT NULL,
  `reminder_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subcategory`
--

CREATE TABLE `subcategory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `sl_id` int(11) NOT NULL,
  `log_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_message` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `ProjectOrClientName` varchar(255) NOT NULL,
  `Category` varchar(255) NOT NULL,
  `SubCategory` varchar(255) NOT NULL,
  `TaskDescription` text NOT NULL,
  `postCount` varchar(15) NOT NULL,
  `videoCount` varchar(10) NOT NULL,
  `ConsumingTimeInMin` int(11) NOT NULL,
  `TotalConsumingTime` int(11) NOT NULL DEFAULT 0,
  `task_date` varchar(15) DEFAULT NULL,
  `post_creative_status` varchar(50) DEFAULT NULL,
  `video_status` varchar(50) DEFAULT NULL,
  `other_graphics_name` varchar(255) DEFAULT NULL,
  `other_graphics_count` int(11) DEFAULT NULL,
  `other_graphics_status` varchar(50) DEFAULT NULL,
  `shootCount` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_users`
--

CREATE TABLE `task_users` (
  `id` int(11) NOT NULL,
  `role` varchar(15) NOT NULL DEFAULT 'user',
  `full_name` varchar(255) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `email_id` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `bloodGroup` varchar(255) NOT NULL DEFAULT 'NA',
  `DOB` varchar(255) NOT NULL,
  `joiningDate` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL DEFAULT 'NA',
  `profileIMG` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(50) DEFAULT NULL,
  `employment_status` enum('active','inactive') DEFAULT NULL,
  `aadhar_number` varchar(100) DEFAULT NULL,
  `pan_number` varchar(100) DEFAULT NULL,
  `driving_licence` varchar(100) DEFAULT NULL,
  `electricity_bill_image` varchar(100) DEFAULT NULL,
  `electricity_bill_ivrs` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(100) DEFAULT NULL,
  `bank_ifsc_number` varchar(100) DEFAULT NULL,
  `bank_upi_id` varchar(100) DEFAULT NULL,
  `bank_barcode` varchar(100) DEFAULT NULL,
  `previous_company_experience_letter` varchar(100) DEFAULT NULL,
  `previous_company_relieving_letter` varchar(100) DEFAULT NULL,
  `salary_slips` varchar(100) DEFAULT NULL,
  `offer_letter` varchar(255) DEFAULT NULL,
  `previous_employer_contact` varchar(100) DEFAULT NULL,
  `graduation_degree_marksheets` varchar(100) DEFAULT NULL,
  `cancelled_cheque` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emp_created_at` varchar(100) DEFAULT NULL,
  `emp_updated_at` varchar(100) DEFAULT NULL,
  `aadhar_card_image` varchar(255) DEFAULT NULL,
  `pan_card_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `termination_letters`
--

CREATE TABLE `termination_letters` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeId` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `terminationDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `department` varchar(255) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `signatory` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `u_Id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `number` varchar(10) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assigned_projects`
--
ALTER TABLE `assigned_projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `assigntarget`
--
ALTER TABLE `assigntarget`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assign_development_tasks`
--
ALTER TABLE `assign_development_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attend_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`attend_date`),
  ADD KEY `unique_user_attend_date` (`user_id`,`attend_date`);

--
-- Indexes for table `attendance_backdate_requests`
--
ALTER TABLE `attendance_backdate_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `attend_leaves`
--
ALTER TABLE `attend_leaves`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `leave_user_id` (`leave_user_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `creative_counts`
--
ALTER TABLE `creative_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD PRIMARY KEY (`en_id`),
  ADD KEY `en_user_id` (`en_user_id`);

--
-- Indexes for table `employee_commitments`
--
ALTER TABLE `employee_commitments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_notifications`
--
ALTER TABLE `employee_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `emp_salary`
--
ALTER TABLE `emp_salary`
  ADD PRIMARY KEY (`salary_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`);

--
-- Indexes for table `expense_records`
--
ALTER TABLE `expense_records`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `followupreport`
--
ALTER TABLE `followupreport`
  ADD PRIMARY KEY (`report_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`lead_Id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `notify_user_id` (`notify_user_id`);

--
-- Indexes for table `otpcollections`
--
ALTER TABLE `otpcollections`
  ADD PRIMARY KEY (`code_id`);

--
-- Indexes for table `paid_holidays`
--
ALTER TABLE `paid_holidays`
  ADD PRIMARY KEY (`hid`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_sub` (`user_id`,`subscription`(255));

--
-- Indexes for table `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `scheduler_notifications`
--
ALTER TABLE `scheduler_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reminder_id` (`reminder_id`),
  ADD KEY `idx_sched_notif_read` (`is_read`);

--
-- Indexes for table `scheduler_reminders`
--
ALTER TABLE `scheduler_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sched_status` (`status`),
  ADD KEY `idx_sched_trigger` (`next_trigger_at`),
  ADD KEY `idx_sched_date` (`reminder_date`);

--
-- Indexes for table `scheduler_reminder_employees`
--
ALTER TABLE `scheduler_reminder_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reminder_emp` (`reminder_id`,`employee_id`);

--
-- Indexes for table `subcategory`
--
ALTER TABLE `subcategory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`sl_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `task_users`
--
ALTER TABLE `task_users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`u_Id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2350;

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `assigned_projects`
--
ALTER TABLE `assigned_projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=396;

--
-- AUTO_INCREMENT for table `assigntarget`
--
ALTER TABLE `assigntarget`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `assign_development_tasks`
--
ALTER TABLE `assign_development_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attend_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6283;

--
-- AUTO_INCREMENT for table `attendance_backdate_requests`
--
ALTER TABLE `attendance_backdate_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT for table `attend_leaves`
--
ALTER TABLE `attend_leaves`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=143;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `creative_counts`
--
ALTER TABLE `creative_counts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `email_notifications`
--
ALTER TABLE `email_notifications`
  MODIFY `en_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_commitments`
--
ALTER TABLE `employee_commitments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_notifications`
--
ALTER TABLE `employee_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_salary`
--
ALTER TABLE `emp_salary`
  MODIFY `salary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `expense_records`
--
ALTER TABLE `expense_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `followupreport`
--
ALTER TABLE `followupreport`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `lead_Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=137;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `otpcollections`
--
ALTER TABLE `otpcollections`
  MODIFY `code_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `paid_holidays`
--
ALTER TABLE `paid_holidays`
  MODIFY `hid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=179;

--
-- AUTO_INCREMENT for table `salary_payments`
--
ALTER TABLE `salary_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `scheduler_notifications`
--
ALTER TABLE `scheduler_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `scheduler_reminders`
--
ALTER TABLE `scheduler_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `scheduler_reminder_employees`
--
ALTER TABLE `scheduler_reminder_employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `subcategory`
--
ALTER TABLE `subcategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `sl_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12719;

--
-- AUTO_INCREMENT for table `task_users`
--
ALTER TABLE `task_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=138;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `u_Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assign_development_tasks`
--
ALTER TABLE `assign_development_tasks`
  ADD CONSTRAINT `assign_development_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`);

--
-- Constraints for table `attendance_backdate_requests`
--
ALTER TABLE `attendance_backdate_requests`
  ADD CONSTRAINT `attendance_backdate_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`),
  ADD CONSTRAINT `attendance_backdate_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users` (`id`);

--
-- Constraints for table `attend_leaves`
--
ALTER TABLE `attend_leaves`
  ADD CONSTRAINT `attend_leaves_ibfk_1` FOREIGN KEY (`leave_user_id`) REFERENCES `task_users` (`id`);

--
-- Constraints for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`en_user_id`) REFERENCES `task_users` (`id`);

--
-- Constraints for table `employee_commitments`
--
ALTER TABLE `employee_commitments`
  ADD CONSTRAINT `employee_commitments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_notifications`
--
ALTER TABLE `employee_notifications`
  ADD CONSTRAINT `employee_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `emp_salary`
--
ALTER TABLE `emp_salary`
  ADD CONSTRAINT `emp_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`notify_user_id`) REFERENCES `task_users` (`id`);

--
-- Constraints for table `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD CONSTRAINT `salary_payments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduler_notifications`
--
ALTER TABLE `scheduler_notifications`
  ADD CONSTRAINT `scheduler_notifications_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `scheduler_reminders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduler_reminder_employees`
--
ALTER TABLE `scheduler_reminder_employees`
  ADD CONSTRAINT `scheduler_reminder_employees_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `scheduler_reminders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
