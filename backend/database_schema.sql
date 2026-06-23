-- ============================================================================
-- Smart Library Management System — Database Schema
-- ============================================================================
-- Run: mysql -u root -p < database_schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_library
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_library;

-- ── Admins / Librarians ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admins (
    admin_id     INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  UNIQUE NOT NULL,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Students / Users ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    user_id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id       VARCHAR(50)  UNIQUE NOT NULL,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(500),
    account_status   ENUM('active', 'suspended') DEFAULT 'active',
    `rank`           VARCHAR(20)  NOT NULL DEFAULT 'Bronze',
    badge_icon       VARCHAR(50)  NOT NULL DEFAULT 'military_tech',
    total_books_read INT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Books ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS books (
    book_id             INT AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    author              VARCHAR(255),
    isbn                VARCHAR(50)  UNIQUE,
    publisher           VARCHAR(255),
    publication_year    INT,
    cover_image_path    VARCHAR(255),
    cover_image_url     VARCHAR(500),
    availability_status ENUM('available', 'borrowed', 'lost') DEFAULT 'available',
    added_by            INT,
    added_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (added_by) REFERENCES admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Borrow Records ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS borrow_records (
    borrow_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    book_id     INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date    DATE NOT NULL,
    return_date DATE,
    status      ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed',
    fine_amount DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    fine_paid   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,

    INDEX idx_user_status (user_id, status),
    INDEX idx_book_status (book_id, status),
    INDEX idx_due_date    (due_date),
    INDEX idx_borrow_fines (fine_amount, fine_paid)
) ENGINE=InnoDB;

-- ── Categories ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
    category_id  INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) UNIQUE NOT NULL,
    description  VARCHAR(500),
    icon         VARCHAR(50)  NOT NULL DEFAULT 'category',
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Book ↔ Categories (Many-to-Many Junction) ──────────────────────────────

CREATE TABLE IF NOT EXISTS book_categories (
    book_id      INT NOT NULL,
    category_id  INT NOT NULL,

    PRIMARY KEY (book_id, category_id),

    FOREIGN KEY (book_id)     REFERENCES books(book_id)         ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,

    INDEX idx_category_books (category_id, book_id)
) ENGINE=InnoDB;

-- ── Indexes for search performance ──────────────────────────────────────────

CREATE FULLTEXT INDEX idx_book_search ON books(title, author);
