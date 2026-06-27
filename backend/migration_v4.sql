-- ============================================================================
-- Smart Library Management System — Database Migration V4 (Book Metadata)
-- ============================================================================

USE smart_library;

-- Add synopsis, language, and shelf_location to books table
ALTER TABLE books
ADD COLUMN synopsis TEXT AFTER cover_image_url,
ADD COLUMN language VARCHAR(50) DEFAULT 'English' AFTER synopsis,
ADD COLUMN shelf_location VARCHAR(100) AFTER language;

-- Ensure v3 tables exist for safety
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    theme_preference ENUM('light', 'dark', 'system') DEFAULT 'system',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('system', 'overdue', 'fine', 'general') DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert some sample notifications
INSERT IGNORE INTO notifications (user_id, title, message, type, is_read) VALUES 
(1, 'Welcome!', 'Welcome to the Smart Library Management System.', 'system', FALSE),
(1, 'Book Overdue', 'Your borrowed book "To Kill a Mockingbird" is overdue. Please return it as soon as possible.', 'overdue', FALSE),
(2, 'New Feature', 'You can now view your reading history.', 'general', FALSE);
