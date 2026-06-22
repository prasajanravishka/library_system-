<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — User API (Student Login & Profile)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints (dispatched by ?action=):
 *   POST  ?action=login       — Authenticate student by student_id + password
 *   GET   ?action=profile     — Get user profile stats (?user_id=)
 *   GET   ?action=search      — Search books (?q=)
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create users table if it doesn't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `user_id` INT AUTO_INCREMENT PRIMARY KEY,
            `student_id` VARCHAR(50) NOT NULL UNIQUE,
            `full_name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `role` ENUM('student', 'faculty', 'staff') DEFAULT 'student',
            `account_status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    // Ignore if it fails due to existing table or permissions
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── Login ───────────────────────────────────────────────────────
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $studentId = trim($data['student_id'] ?? '');
            $password  = $data['password'] ?? '';

            if (empty($studentId) || empty($password)) {
                jsonError('Student ID and password are required', 400);
            }

            $stmt = $pdo->prepare(
                "SELECT user_id, student_id, full_name, email, password_hash, account_status
                 FROM users WHERE student_id = :sid LIMIT 1"
            );
            $stmt->execute([':sid' => $studentId]);
            $user = $stmt->fetch();

            if (!$user) {
                jsonError('Invalid student ID or password', 401);
            }

            if ($user['account_status'] === 'suspended') {
                jsonError('Account is suspended. Contact the library admin.', 403);
            }

            if (!password_verify($password, $user['password_hash'])) {
                jsonError('Invalid student ID or password', 401);
            }

            jsonSuccess([
                'message' => 'Login successful',
                'user' => [
                    'user_id'    => (int) $user['user_id'],
                    'student_id' => $user['student_id'],
                    'full_name'  => $user['full_name'],
                    'email'      => $user['email'],
                    'role'       => 'student',
                ],
            ]);
            break;

        // ── Profile Stats ───────────────────────────────────────────────
        case 'profile':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            // User details
            $stmt = $pdo->prepare("SELECT full_name, email FROM users WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $user = $stmt->fetch();

            if (!$user) {
                jsonError('User not found', 404);
            }

            // Total borrowed
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $totalBorrowed = (int) $stmt->fetch()['count'];

            // Total overdue
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) as count FROM borrow_records
                 WHERE user_id = :uid AND status = 'borrowed' AND due_date < CURDATE()"
            );
            $stmt->execute([':uid' => $userId]);
            $totalOverdue = (int) $stmt->fetch()['count'];

            // Rank
            if ($totalBorrowed < 5) {
                $rank = 'Bronze';
            } elseif ($totalBorrowed < 15) {
                $rank = 'Silver';
            } else {
                $rank = 'Gold';
            }

            jsonSuccess([
                'profile' => [
                    'full_name'      => $user['full_name'],
                    'email'          => $user['email'],
                    'role'           => 'student',
                    'total_borrowed' => $totalBorrowed,
                    'total_overdue'  => $totalOverdue,
                    'rank'           => $rank,
                ],
            ]);
            break;

        // ── Search Books ────────────────────────────────────────────────
        case 'search':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $query = trim($_GET['q'] ?? '');
            if (empty($query)) {
                jsonError('Search query (q) is required', 400);
            }

            $searchTerm = "%{$query}%";
            $stmt = $pdo->prepare(
                "SELECT book_id, title, author, isbn, publisher, publication_year,
                        cover_image_path, availability_status
                 FROM books
                 WHERE title LIKE :q1 OR author LIKE :q2 OR isbn LIKE :q3
                 ORDER BY title ASC
                 LIMIT 50"
            );
            $stmt->execute([':q1' => $searchTerm, ':q2' => $searchTerm, ':q3' => $searchTerm]);
            $books = $stmt->fetchAll();

            // Cast IDs to int
            foreach ($books as &$book) {
                $book['book_id'] = (int) $book['book_id'];
                if ($book['publication_year'] !== null) {
                    $book['publication_year'] = (int) $book['publication_year'];
                }
            }

            jsonSuccess(['books' => $books]);
            break;

        default:
            jsonError('Unknown action. Valid actions: login, profile, search', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
