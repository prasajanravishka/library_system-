-- ============================================================================
-- Smart Library Management System — Migration v2
-- Schema Enhancement: Categories, Gamification, Fine Tracking
-- ============================================================================
-- Run: mysql -u root -p smart_library < migration_v2.sql
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================================

USE smart_library;

-- ── 1. Categories Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
    category_id  INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) UNIQUE NOT NULL,
    description  VARCHAR(500),
    icon         VARCHAR(50)  NOT NULL DEFAULT 'category',
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default categories (matching current hardcoded values + extras)
INSERT IGNORE INTO categories (category_id, name, description, icon, sort_order) VALUES
    (1, 'Technology',  'Computer science, programming, and IT books',             'computer',     1),
    (2, 'Fiction',     'Novels, short stories, and literary fiction',              'auto_stories', 2),
    (3, 'Science',     'Physics, chemistry, biology, and natural sciences',       'science',      3),
    (4, 'History',     'World history, civilisations, and historical analysis',   'history',      4),
    (5, 'Art',         'Visual arts, music, design, and architecture',            'palette',      5),
    (6, 'Mathematics', 'Algebra, calculus, statistics, and applied math',         'calculate',    6),
    (7, 'Philosophy',  'Ethics, logic, metaphysics, and critical thinking',       'psychology',   7),
    (8, 'Literature',  'Poetry, drama, classics, and literary criticism',         'menu_book',    8);

-- ── 2. Book ↔ Categories Junction Table (Many-to-Many) ─────────────────────

CREATE TABLE IF NOT EXISTS book_categories (
    book_id      INT NOT NULL,
    category_id  INT NOT NULL,

    PRIMARY KEY (book_id, category_id),

    FOREIGN KEY (book_id)     REFERENCES books(book_id)         ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,

    INDEX idx_category_books (category_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: assign sample books to categories
INSERT IGNORE INTO book_categories (book_id, category_id) VALUES
    (1, 2),  -- The Great Gatsby → Fiction
    (2, 2),  -- 1984 → Fiction
    (3, 2),  -- To Kill a Mockingbird → Fiction
    (4, 2),  -- The Catcher in the Rye → Fiction
    (5, 2),  -- Pride and Prejudice → Fiction
    (5, 8);  -- Pride and Prejudice → Literature (multi-category)

-- ── 3. Users Table — Add Gamification Columns ──────────────────────────────
-- Using separate ALTER statements for MySQL < 8.0.28 compatibility
-- (ADD COLUMN IF NOT EXISTS requires MySQL 8.0.28+)

-- profile_image_url
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image_url');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER password_hash',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- rank
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'rank');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN `rank` VARCHAR(20) NOT NULL DEFAULT ''Bronze'' AFTER account_status',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- badge_icon
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'badge_icon');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN badge_icon VARCHAR(50) NOT NULL DEFAULT ''military_tech'' AFTER `rank`',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- total_books_read
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_books_read');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN total_books_read INT NOT NULL DEFAULT 0 AFTER badge_icon',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill rank from existing borrow counts
UPDATE users u SET
    total_books_read = (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.user_id),
    `rank` = CASE
        WHEN (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.user_id) >= 15 THEN 'Gold'
        WHEN (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.user_id) >= 5  THEN 'Silver'
        ELSE 'Bronze'
    END,
    badge_icon = CASE
        WHEN (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.user_id) >= 15 THEN 'emoji_events'
        WHEN (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.user_id) >= 5  THEN 'workspace_premium'
        ELSE 'military_tech'
    END;

-- ── 4. Books Table — Add Cover Image URL ────────────────────────────────────

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'books' AND COLUMN_NAME = 'cover_image_url');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE books ADD COLUMN cover_image_url VARCHAR(500) NULL AFTER cover_image_path',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 5. Borrow Records — Add Fine Tracking ──────────────────────────────────

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'borrow_records' AND COLUMN_NAME = 'fine_amount');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE borrow_records ADD COLUMN fine_amount DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER status',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_library' AND TABLE_NAME = 'borrow_records' AND COLUMN_NAME = 'fine_paid');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE borrow_records ADD COLUMN fine_paid BOOLEAN NOT NULL DEFAULT FALSE AFTER fine_amount',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Migration v2 complete.
-- New tables: categories, book_categories
-- New columns: users.(profile_image_url, rank, badge_icon, total_books_read)
--              books.cover_image_url
--              borrow_records.(fine_amount, fine_paid)
-- ============================================================================
