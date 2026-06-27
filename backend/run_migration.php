<?php
$dbHost = '127.0.0.1';
$dbName = 'smart_library';
$dbUser = 'root';
$dbPass = '';
$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=$charset", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "Running migration V4...\n";
    
    try {
        $pdo->exec("
            ALTER TABLE books
            ADD COLUMN synopsis TEXT AFTER cover_image_url,
            ADD COLUMN language VARCHAR(50) DEFAULT 'English' AFTER synopsis,
            ADD COLUMN shelf_location VARCHAR(100) AFTER language
        ");
        echo "✅ Columns added to books\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "✅ Columns already exist in books\n";
        } else {
            throw $e;
        }
    }

    // Ensure v3 tables exist for safety
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_settings (
            setting_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            push_notifications BOOLEAN DEFAULT TRUE,
            email_notifications BOOLEAN DEFAULT TRUE,
            theme_preference ENUM('light', 'dark', 'system') DEFAULT 'system',
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ");

    $pdo->exec("
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
        ) ENGINE=InnoDB
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS support_tickets (
            ticket_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ");
    echo "✅ Tables created\n";

    // Insert some sample notifications
    $pdo->exec("
        INSERT IGNORE INTO notifications (user_id, title, message, type, is_read) VALUES 
        (1, 'Welcome!', 'Welcome to the Smart Library Management System.', 'system', FALSE),
        (1, 'Book Overdue', 'Your borrowed book \"To Kill a Mockingbird\" is overdue. Please return it as soon as possible.', 'overdue', FALSE),
        (2, 'New Feature', 'You can now view your reading history.', 'general', FALSE)
    ");
    echo "✅ Sample notifications added\n";
    
    // Update existing books with some dummy data for the new columns so they aren't NULL
    $pdo->exec("UPDATE books SET synopsis = 'A story of the wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.', language = 'English', shelf_location = 'Shelf A1 - Row 1' WHERE book_id = 1");
    $pdo->exec("UPDATE books SET synopsis = 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real.', language = 'English', shelf_location = 'Shelf A1 - Row 2' WHERE book_id = 2");
    $pdo->exec("UPDATE books SET synopsis = 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.', language = 'English', shelf_location = 'Shelf A2 - Row 1' WHERE book_id = 3");
    $pdo->exec("UPDATE books SET synopsis = 'The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield.', language = 'English', shelf_location = 'Shelf A2 - Row 2' WHERE book_id = 4");
    $pdo->exec("UPDATE books SET synopsis = 'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.', language = 'English', shelf_location = 'Shelf A3 - Row 1' WHERE book_id = 5");

    echo "Done.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
