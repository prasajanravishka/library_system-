-- schema.sql
-- Run this file in your MySQL database to create the required tables.
-- E.g. mysql -u root -p smart_library < schema.sql

CREATE DATABASE IF NOT EXISTS smart_library;
USE smart_library;

-- Users table (with RBAC role support)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'librarian') DEFAULT 'student',
    account_status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(50) UNIQUE,
    publisher VARCHAR(255),
    publication_year INT,
    cover_image_path VARCHAR(255),
    availability_status ENUM('available', 'borrowed', 'lost') DEFAULT 'available',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowed Books table
CREATE TABLE IF NOT EXISTS borrowed_books (
    borrow_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
