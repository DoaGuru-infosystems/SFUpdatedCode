-- MySQL dump 10.13  Distrib 9.6.0, for macos15 (arm64)
--
-- Host: localhost    Database: sf
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'e61c10bc-0bd7-11f1-9e4e-42b7d0ec2e22:1-13174';

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2350 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_user`
--

DROP TABLE IF EXISTS `admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user` (
  `id` int NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('admin','manager') NOT NULL DEFAULT 'manager',
  `full_name` varchar(255) DEFAULT NULL,
  `email_id` varchar(255) NOT NULL,
  `admin_number` varchar(100) DEFAULT NULL,
  `designation` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assign_development_tasks`
--

DROP TABLE IF EXISTS `assign_development_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assign_development_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_or_client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','In Progress','Completed') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `task_date` date NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `assign_development_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assigned_projects`
--

DROP TABLE IF EXISTS `assigned_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigned_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `category_id` (`category_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=396 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assigntarget`
--

DROP TABLE IF EXISTS `assigntarget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigntarget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employeeId` int NOT NULL,
  `projectId` int NOT NULL,
  `month` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` year NOT NULL,
  `targetPost` int DEFAULT '0',
  `targetVideo` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `targetShoot` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attend_leaves`
--

DROP TABLE IF EXISTS `attend_leaves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attend_leaves` (
  `leave_id` int NOT NULL AUTO_INCREMENT,
  `leave_user_id` int NOT NULL,
  `leave_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leave_duration` enum('fullday','halfday') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fullday',
  `leave_type` enum('Sick Leave','Casual Leave','Paid Leave','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `leave_reason` text COLLATE utf8mb4_unicode_ci,
  `leave_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `applied_at_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`leave_id`),
  KEY `leave_user_id` (`leave_user_id`),
  CONSTRAINT `attend_leaves_ibfk_1` FOREIGN KEY (`leave_user_id`) REFERENCES `task_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attend_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_selfie_url` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_latitude` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_longitude` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_selfie_url` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_latitude` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logout_longitude` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_minutes` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `day_status` enum('full','half','absent','leave','weekend_served','logged-in') COLLATE utf8mb4_unicode_ci DEFAULT 'logged-in',
  `attend_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`attend_id`),
  UNIQUE KEY `user_id` (`user_id`,`attend_date`),
  KEY `unique_user_attend_date` (`user_id`,`attend_date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance_backdate_requests`
--

DROP TABLE IF EXISTS `attendance_backdate_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_backdate_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `request_date` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abr_reason` text COLLATE utf8mb4_unicode_ci,
  `abr_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `requested_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `request_type` enum('backdate','edit') COLLATE utf8mb4_unicode_ci DEFAULT 'backdate',
  `requested_login_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_logout_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `employee_id` (`employee_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `attendance_backdate_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`),
  CONSTRAINT `attendance_backdate_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=149 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `creative_counts`
--

DROP TABLE IF EXISTS `creative_counts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `creative_counts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `creative` int DEFAULT '0',
  `video` int DEFAULT '0',
  `flyer` int DEFAULT '0',
  `other` int DEFAULT '0',
  `date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_notifications`
--

DROP TABLE IF EXISTS `email_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_notifications` (
  `en_id` int NOT NULL AUTO_INCREMENT,
  `en_user_id` int NOT NULL,
  `type_notification` enum('login_reminder','logout_reminder','leave_approved','leave_rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `en_status` enum('send','failed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `en_created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`en_id`),
  KEY `en_user_id` (`en_user_id`),
  CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`en_user_id`) REFERENCES `task_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emp_salary`
--

DROP TABLE IF EXISTS `emp_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emp_salary` (
  `salary_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `salary_amount` int NOT NULL,
  `salary_created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_updated_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`salary_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  CONSTRAINT `emp_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_commitments`
--

DROP TABLE IF EXISTS `employee_commitments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_commitments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `commitment_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `employee_commitments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_notifications`
--

DROP TABLE IF EXISTS `employee_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('leave','attendance','system','reminder') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employee_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_records`
--

DROP TABLE IF EXISTS `expense_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experincel`
--

DROP TABLE IF EXISTS `experincel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experincel` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `joining_date` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `resignation_date` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `followupreport`
--

DROP TABLE IF EXISTS `followupreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `followupreport` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `lead_Id` int DEFAULT NULL,
  `u_Id` int DEFAULT NULL,
  `followUpDate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `followUpPhase` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `followUpReport` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genrate_letters`
--

DROP TABLE IF EXISTS `genrate_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genrate_letters` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `letter_type` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `Date` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `designation` varchar(200) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `intern_experience_letters`
--

DROP TABLE IF EXISTS `intern_experience_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intern_experience_letters` (
  `id` int NOT NULL,
  `employeeName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employeeId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `intern_ppo_letters`
--

DROP TABLE IF EXISTS `intern_ppo_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intern_ppo_letters` (
  `id` int NOT NULL,
  `employeeName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employeeId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `oldDesignation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `newDesignation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `newCTC` float DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `basic_salary` float DEFAULT NULL,
  `hra` float DEFAULT NULL,
  `allowances` float DEFAULT NULL,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internship_offers`
--

DROP TABLE IF EXISTS `internship_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_offers` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `gender` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phoneNumber` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `address` text COLLATE utf8mb4_general_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `startDate` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `endDate` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `stipend` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `mentorName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `mentorContact` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `signatory` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `termsAndConditions` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `lead_Id` int NOT NULL AUTO_INCREMENT,
  `u_Id` int DEFAULT NULL,
  `fullName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mobileNo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date` date NOT NULL DEFAULT (curdate()),
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `inquiryType` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nextFollowDate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nextFollowPhase` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `remind` varchar(255) COLLATE utf8mb4_general_ci DEFAULT '{   "week": "false",   "yesterday": "false",   "today": "false",   "onehour": "false",   "halfhour": "false" }',
  PRIMARY KEY (`lead_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `notify_user_id` int NOT NULL,
  `notification_type` enum('login_reminder','logout_reminder') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notification_status` enum('sent','failed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notify_created_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `notify_user_id` (`notify_user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`notify_user_id`) REFERENCES `task_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `offer_letters`
--

DROP TABLE IF EXISTS `offer_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_letters` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `address` text COLLATE utf8mb4_general_ci NOT NULL,
  `phoneNumber` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `gender` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `offerReleaseDate` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `joiningDate` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `salary` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `probationPeriod` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `noticePeriod` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `confirmationNoticePeriod` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `jobResponsibilities` text COLLATE utf8mb4_general_ci NOT NULL,
  `signatory` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otpcollections`
--

DROP TABLE IF EXISTS `otpcollections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otpcollections` (
  `code_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` int DEFAULT NULL,
  `generated_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`code_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paid_holidays`
--

DROP TABLE IF EXISTS `paid_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paid_holidays` (
  `hid` int NOT NULL AUTO_INCREMENT,
  `holiday_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_date` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `holiday_created_at` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`hid`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subscription` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_sub` (`user_id`,`subscription`(255))
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `relieving_letters`
--

DROP TABLE IF EXISTS `relieving_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `relieving_letters` (
  `id` int NOT NULL,
  `employeeName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dateOfJoining` date DEFAULT NULL,
  `dateOfRelieving` date DEFAULT NULL,
  `lastWorkingDay` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_payments`
--

DROP TABLE IF EXISTS `salary_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `total_salary` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `remaining_amount` decimal(10,2) DEFAULT '0.00',
  `payment_duration` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `remaining_paid_date` date DEFAULT NULL,
  `status` enum('Paid','Partial','Pending') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `salary_payments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `task_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_slips`
--

DROP TABLE IF EXISTS `salary_slips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_slips` (
  `id` int NOT NULL,
  `employeeName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employeeId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `month` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `grossSalary` float DEFAULT NULL,
  `netSalary` float DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `basic_salary` float DEFAULT NULL,
  `hra` float DEFAULT NULL,
  `pf` float DEFAULT NULL,
  `esi` float DEFAULT NULL,
  `allowances` float DEFAULT NULL,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scheduler_notifications`
--

DROP TABLE IF EXISTS `scheduler_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduler_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reminder_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `channel_type` enum('whatsapp','email','inapp','sms') NOT NULL,
  `message_body` text NOT NULL,
  `delivery_status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `failure_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reminder_id` (`reminder_id`),
  KEY `idx_sched_notif_read` (`is_read`),
  CONSTRAINT `scheduler_notifications_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `scheduler_reminders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scheduler_reminder_employees`
--

DROP TABLE IF EXISTS `scheduler_reminder_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduler_reminder_employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reminder_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reminder_emp` (`reminder_id`,`employee_id`),
  CONSTRAINT `scheduler_reminder_employees_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `scheduler_reminders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scheduler_reminders`
--

DROP TABLE IF EXISTS `scheduler_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduler_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int DEFAULT NULL,
  `assignment_type` enum('self','single','multiple','team') NOT NULL DEFAULT 'self',
  `title` varchar(255) NOT NULL,
  `note` text,
  `reminder_date` date NOT NULL,
  `reminder_time` time NOT NULL,
  `repeat_type` enum('none','hourly','daily','alternate_days','weekly','monthly','custom','never_ends') DEFAULT 'none',
  `custom_repeat_data` json DEFAULT NULL,
  `remind_before` varchar(50) DEFAULT '10_minutes',
  `custom_remind_minutes` int DEFAULT NULL,
  `delivery_method` varchar(50) DEFAULT 'inapp_only',
  `message_template` text,
  `dnd_enabled` tinyint(1) DEFAULT '0',
  `dnd_start_time` time DEFAULT NULL,
  `dnd_end_time` time DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `next_trigger_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sched_status` (`status`),
  KEY `idx_sched_trigger` (`next_trigger_at`),
  KEY `idx_sched_date` (`reminder_date`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subcategory`
--

DROP TABLE IF EXISTS `subcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_logs` (
  `sl_id` int NOT NULL AUTO_INCREMENT,
  `log_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_message` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`sl_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_users`
--

DROP TABLE IF EXISTS `task_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_users` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `pan_card_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `ProjectOrClientName` varchar(255) NOT NULL,
  `Category` varchar(255) NOT NULL,
  `SubCategory` varchar(255) NOT NULL,
  `TaskDescription` text NOT NULL,
  `postCount` varchar(15) NOT NULL,
  `videoCount` varchar(10) NOT NULL,
  `ConsumingTimeInMin` int NOT NULL,
  `TotalConsumingTime` int NOT NULL DEFAULT '0',
  `task_date` varchar(15) DEFAULT NULL,
  `post_creative_status` varchar(50) DEFAULT NULL,
  `video_status` varchar(50) DEFAULT NULL,
  `other_graphics_name` varchar(255) DEFAULT NULL,
  `other_graphics_count` int DEFAULT NULL,
  `other_graphics_status` varchar(50) DEFAULT NULL,
  `shootCount` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12719 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `termination_letters`
--

DROP TABLE IF EXISTS `termination_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `termination_letters` (
  `id` int NOT NULL,
  `employeeName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employeeId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `terminationDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `department` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signatory` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `u_Id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `number` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`u_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-02 13:45:14
