<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library Setup Script — Initialize Database & Import Sample Data
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Run this once to set up your database:
 *   http://localhost:8000/api/setup.php
 * ════════════════════════════════════════════════════════════════════════════
 */

// Database configuration
$dbHost = '127.0.0.1';
$dbName = 'smart_library';
$dbUser = 'root';
$dbPass = '';
$charset = 'utf8mb4';

echo "<h2>🔧 Smart Library Setup</h2>";

// ── Step 1: Connect to MySQL (without specifying database yet) ──
echo "<p>Step 1: Connecting to MySQL...</p>";
try {
    $pdo = new PDO("mysql:host=$dbHost;charset=$charset", $dbUser, $dbPass);
    echo "✅ Connected to MySQL\n";
} catch (PDOException $e) {
    echo "❌ Failed to connect to MySQL: " . $e->getMessage() . "\n";
    echo "Make sure MySQL is running and credentials are correct.";
    exit;
}

// ── Step 2: Create database ──
echo "<p>Step 2: Creating database...</p>";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` 
               CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "✅ Database created/exists\n";
} catch (PDOException $e) {
    echo "❌ Failed to create database: " . $e->getMessage() . "\n";
    exit;
}

// ── Step 3: Connect to the database ──
echo "<p>Step 3: Selecting database...</p>";
try {
    $pdo->exec("USE `$dbName`;");
    echo "✅ Database selected\n";
} catch (PDOException $e) {
    echo "❌ Failed to select database: " . $e->getMessage() . "\n";
    exit;
}

// ── Step 4: Create tables ──
echo "<p>Step 4: Creating tables...</p>";
try {
    // Admins table
    $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
        admin_id     INT AUTO_INCREMENT PRIMARY KEY,
        username     VARCHAR(50)  UNIQUE NOT NULL,
        full_name    VARCHAR(100) NOT NULL,
        email        VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // Users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        user_id        INT AUTO_INCREMENT PRIMARY KEY,
        student_id     VARCHAR(50)  UNIQUE NOT NULL,
        full_name      VARCHAR(100) NOT NULL,
        email          VARCHAR(100) UNIQUE NOT NULL,
        password_hash  VARCHAR(255) NOT NULL,
        account_status ENUM('active', 'suspended') DEFAULT 'active',
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // Books table
    $pdo->exec("CREATE TABLE IF NOT EXISTS books (
        book_id             INT AUTO_INCREMENT PRIMARY KEY,
        title               VARCHAR(255) NOT NULL,
        author              VARCHAR(255),
        isbn                VARCHAR(50)  UNIQUE,
        publisher           VARCHAR(255),
        publication_year    INT,
        cover_image_path    VARCHAR(255),
        availability_status ENUM('available', 'borrowed', 'lost') DEFAULT 'available',
        added_by            INT,
        added_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by) REFERENCES admins(admin_id) ON DELETE SET NULL
    ) ENGINE=InnoDB;");

    // Borrow records table
    $pdo->exec("CREATE TABLE IF NOT EXISTS borrow_records (
        borrow_id   INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        book_id     INT NOT NULL,
        borrow_date DATE NOT NULL,
        due_date    DATE NOT NULL,
        return_date DATE,
        status      ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
        INDEX idx_user_status (user_id, status),
        INDEX idx_book_status (book_id, status),
        INDEX idx_due_date    (due_date)
    ) ENGINE=InnoDB;");

    echo "✅ Tables created\n";
} catch (PDOException $e) {
    echo "❌ Failed to create tables: " . $e->getMessage() . "\n";
    exit;
}

// ── Step 5: Import sample data ──
echo "<p>Step 5: Importing sample data...</p>";
try {
    // Hash of 'password123'
    $pwHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    // Insert admin
    $pdo->exec("INSERT IGNORE INTO admins (username, full_name, email, password_hash) 
               VALUES ('librarian', 'Head Librarian', 'librarian@library.edu', '$pwHash');");

    // Insert users (students)
    $pdo->exec("INSERT IGNORE INTO users (student_id, full_name, email, password_hash, account_status) 
               VALUES 
               ('S12345', 'John Doe', 'john@example.com', '$pwHash', 'active'),
               ('S67890', 'Jane Smith', 'jane@example.com', '$pwHash', 'active'),
               ('S11111', 'Bob User', 'bob@example.com', '$pwHash', 'suspended');");

    // Insert books
    $pdo->exec("INSERT IGNORE INTO books (title, author, isbn, publisher, publication_year, availability_status, added_by) 
               VALUES 
               ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', 1925, 'available', 1),
               ('1984', 'George Orwell', '9780451524935', 'Signet Classic', 1949, 'available', 1),
               ('To Kill a Mockingbird', 'Harper Lee', '9780060935467', 'Harper Perennial', 1960, 'borrowed', 1),
               ('The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 'Little Brown', 1951, 'available', 1),
               ('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Penguin Classics', 1813, 'available', 1);");

    // Insert borrow records
    $pdo->exec("INSERT IGNORE INTO borrow_records (user_id, book_id, borrow_date, due_date, status) 
               VALUES 
               (1, 3, '2026-06-01', '2026-06-15', 'overdue'),
               (2, 5, '2026-06-18', '2026-07-02', 'borrowed');");

    echo "✅ Sample data imported\n";
} catch (PDOException $e) {
    echo "❌ Failed to import data: " . $e->getMessage() . "\n";
    exit;
}

echo "<hr>";
echo "<h3>✅ Setup Complete!</h3>";
echo "<p><strong>You can now login with:</strong></p>";
echo "<ul>";
echo "<li><strong>Student ID:</strong> S12345</li>";
echo "<li><strong>Password:</strong> password123</li>";
echo "</ul>";
echo "<p>Try logging in to your Flutter app now!</p>";
?>
