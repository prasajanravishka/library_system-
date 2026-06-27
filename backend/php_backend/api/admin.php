<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Admin / Librarian API
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints (dispatched by ?action=):
 *   POST  ?action=login          — Authenticate librarian
 *   POST  ?action=add_book       — Add a new book to inventory
 *   PUT   ?action=update_book    — Update existing book details (&book_id=)
 *   GET   ?action=all_books      — List entire inventory
 *   GET   ?action=all_users      — List all registered students
 *   PUT   ?action=toggle_user    — Activate/suspend a student (&user_id=)
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create admins and books tables if they don't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `admins` (
            `admin_id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `full_name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `books` (
            `book_id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `author` VARCHAR(255) NOT NULL,
            `isbn` VARCHAR(50) NULL,
            `publisher` VARCHAR(255) NULL,
            `publication_year` INT NULL,
            `cover_image_path` VARCHAR(255) NULL,
            `availability_status` ENUM('available', 'borrowed', 'lost', 'damaged') DEFAULT 'available',
            `added_by` INT NULL,
            `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`added_by`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    // Ignore if it fails due to existing table or permissions
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── Librarian Login ─────────────────────────────────────────────
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $username = trim($data['username'] ?? '');
            $password = $data['password'] ?? '';

            if (empty($username) || empty($password)) {
                jsonError('Username and password are required', 400);
            }

            $stmt = $pdo->prepare(
                "SELECT admin_id, username, full_name, email, password_hash
                 FROM admins WHERE username = :uname LIMIT 1"
            );
            $stmt->execute([':uname' => $username]);
            $admin = $stmt->fetch();

            if (!$admin) {
                jsonError('Invalid username or password', 401);
            }

            if (!password_verify($password, $admin['password_hash'])) {
                jsonError('Invalid username or password', 401);
            }

            jsonSuccess([
                'message' => 'Login successful',
                'user' => [
                    'user_id'    => (int) $admin['admin_id'],
                    'student_id' => $admin['username'],
                    'full_name'  => $admin['full_name'],
                    'email'      => $admin['email'],
                    'role'       => 'librarian',
                ],
            ]);
            break;

        // ── Add Book ────────────────────────────────────────────────────
        case 'add_book':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $title = trim($data['title'] ?? '');

            if (empty($title)) {
                jsonError('Title is required', 400);
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                "INSERT INTO books (title, author, isbn, publisher, publication_year, cover_image_path, cover_image_url, added_by)
                 VALUES (:title, :author, :isbn, :publisher, :year, :cover, :cover_url, :added_by)"
            );
            $stmt->execute([
                ':title'     => $title,
                ':author'    => trim($data['author'] ?? ''),
                ':isbn'      => !empty($data['isbn']) ? trim($data['isbn']) : null,
                ':publisher' => trim($data['publisher'] ?? ''),
                ':year'      => !empty($data['publication_year']) ? (int) $data['publication_year'] : null,
                ':cover'     => trim($data['cover_image_path'] ?? ''),
                ':cover_url' => trim($data['cover_image_url'] ?? ''),
                ':added_by'  => !empty($data['added_by']) ? (int) $data['added_by'] : null,
            ]);

            $bookId = (int) $pdo->lastInsertId();

            // Insert category associations if provided
            if (!empty($data['category_ids']) && is_array($data['category_ids'])) {
                $catStmt = $pdo->prepare(
                    "INSERT IGNORE INTO book_categories (book_id, category_id) VALUES (:bid, :cid)"
                );
                foreach ($data['category_ids'] as $catId) {
                    $catStmt->execute([':bid' => $bookId, ':cid' => (int) $catId]);
                }
            }

            $pdo->commit();

            jsonSuccess([
                'message' => 'Book added successfully',
                'book_id' => $bookId,
            ], 201);
            break;

        // ── Update Book ─────────────────────────────────────────────────
        case 'update_book':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $bookId = (int) ($_GET['book_id'] ?? 0);
            if ($bookId <= 0) {
                jsonError('Valid book_id is required', 400);
            }

            $data = getJsonBody();
            $updates = [];
            $params  = [':bid' => $bookId];

            $allowed = ['title', 'author', 'isbn', 'publisher', 'publication_year'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($updates)) {
                jsonError('No fields to update', 400);
            }

            $sql = "UPDATE books SET " . implode(', ', $updates) . " WHERE book_id = :bid";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            jsonSuccess(['message' => 'Book updated successfully']);
            break;

        // ── List All Books ──────────────────────────────────────────────
        case 'all_books':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $stmt = $pdo->query(
                "SELECT book_id, title, author, isbn, publisher, publication_year,
                        cover_image_path, cover_image_url, availability_status, added_at
                 FROM books ORDER BY added_at DESC"
            );
            $books = $stmt->fetchAll();

            foreach ($books as &$book) {
                $book['book_id'] = (int) $book['book_id'];
                if ($book['publication_year'] !== null) {
                    $book['publication_year'] = (int) $book['publication_year'];
                }
            }

            jsonSuccess(['books' => $books]);
            break;

        // ── List All Users ──────────────────────────────────────────────
        case 'all_users':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $stmt = $pdo->query(
                "SELECT user_id, student_id, full_name, email, account_status, created_at
                 FROM users ORDER BY created_at DESC"
            );
            $users = $stmt->fetchAll();

            foreach ($users as &$u) {
                $u['user_id'] = (int) $u['user_id'];
            }

            jsonSuccess(['users' => $users]);
            break;

        // ── Toggle User Status ──────────────────────────────────────────
        case 'toggle_user':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            // Get current status
            $stmt = $pdo->prepare("SELECT account_status FROM users WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $user = $stmt->fetch();

            if (!$user) {
                jsonError('User not found', 404);
            }

            $newStatus = ($user['account_status'] === 'active') ? 'suspended' : 'active';
            $stmt = $pdo->prepare("UPDATE users SET account_status = :status WHERE user_id = :uid");
            $stmt->execute([':status' => $newStatus, ':uid' => $userId]);

            jsonSuccess([
                'message' => "User status changed to {$newStatus}",
                'new_status' => $newStatus,
            ]);
            break;

        default:
            jsonError('Unknown action. Valid: login, add_book, update_book, all_books, all_users, toggle_user', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
