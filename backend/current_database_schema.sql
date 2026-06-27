-- Smart Library Database Schema Dump
-- Generated on 2026-06-27 10:57:00

-- --------------------------------------------------------
-- Table structure for `admins`
-- --------------------------------------------------------
CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `book_categories`
-- --------------------------------------------------------
CREATE TABLE `book_categories` (
  `book_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  PRIMARY KEY (`book_id`,`category_id`),
  KEY `idx_category_books` (`category_id`,`book_id`),
  CONSTRAINT `book_categories_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE,
  CONSTRAINT `book_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `books`
-- --------------------------------------------------------
CREATE TABLE `books` (
  `book_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `isbn` varchar(50) DEFAULT NULL,
  `total_copies` int(11) NOT NULL DEFAULT 1,
  `available_copies` int(11) NOT NULL DEFAULT 1,
  `publisher` varchar(255) DEFAULT NULL,
  `publication_year` int(11) DEFAULT NULL,
  `cover_image_path` varchar(255) DEFAULT NULL,
  `cover_image_url` varchar(500) DEFAULT NULL,
  `synopsis` text DEFAULT NULL,
  `language` varchar(50) DEFAULT 'English',
  `shelf_location` varchar(100) DEFAULT NULL,
  `availability_status` enum('available','borrowed','lost') DEFAULT 'available',
  `added_by` int(11) DEFAULT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `location_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`book_id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `added_by` (`added_by`),
  KEY `location_id` (`location_id`),
  FULLTEXT KEY `idx_book_search` (`title`,`author`),
  FULLTEXT KEY `ft_idx_books` (`title`,`author`,`isbn`),
  CONSTRAINT `books_ibfk_1` FOREIGN KEY (`added_by`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL,
  CONSTRAINT `books_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `borrow_records`
-- --------------------------------------------------------
CREATE TABLE `borrow_records` (
  `borrow_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('borrowed','returned','overdue') DEFAULT 'borrowed',
  `fine_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `fine_paid` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`borrow_id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_book_status` (`book_id`,`status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `borrow_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `borrow_records_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `categories`
-- --------------------------------------------------------
CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `icon` varchar(50) NOT NULL DEFAULT 'category',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `locations`
-- --------------------------------------------------------
CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `notifications`
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','overdue','fine','general') DEFAULT 'general',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `support_tickets`
-- --------------------------------------------------------
CREATE TABLE `support_tickets` (
  `ticket_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `user_settings`
-- --------------------------------------------------------
CREATE TABLE `user_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `push_notifications` tinyint(1) DEFAULT 1,
  `email_notifications` tinyint(1) DEFAULT 1,
  `theme_preference` enum('light','dark','system') DEFAULT 'system',
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `account_status` enum('active','suspended') DEFAULT 'active',
  `rank` varchar(20) NOT NULL DEFAULT 'Bronze',
  `badge_icon` varchar(50) NOT NULL DEFAULT 'military_tech',
  `total_books_read` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

