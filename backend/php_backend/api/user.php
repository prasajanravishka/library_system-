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
            `profile_image_url` VARCHAR(255) DEFAULT NULL,
            `rank` VARCHAR(50) DEFAULT 'Bronze',
            `badge_icon` VARCHAR(50) DEFAULT 'military_tech',
            `total_books_read` INT DEFAULT 0,
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

            // User details (including persisted rank/badge)
            $stmt = $pdo->prepare(
                "SELECT full_name, email, profile_image_url, `rank`, badge_icon, total_books_read
                 FROM users WHERE user_id = :uid"
            );
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

            // Total fines pending
            $stmt = $pdo->prepare(
                "SELECT COALESCE(SUM(fine_amount), 0) as total FROM borrow_records
                 WHERE user_id = :uid AND fine_paid = FALSE AND fine_amount > 0"
            );
            $stmt->execute([':uid' => $userId]);
            $totalFinesPending = (float) $stmt->fetch()['total'];

            jsonSuccess([
                'profile' => [
                    'full_name'          => $user['full_name'],
                    'email'              => $user['email'],
                    'profile_image_url'  => $user['profile_image_url'],
                    'role'               => 'student',
                    'total_borrowed'     => $totalBorrowed,
                    'total_overdue'      => $totalOverdue,
                    'total_fines_pending'=> $totalFinesPending,
                    'rank'               => $user['rank'] ?? 'Bronze',
                    'badge_icon'         => $user['badge_icon'] ?? 'military_tech',
                    'total_books_read'   => (int) ($user['total_books_read'] ?? 0),
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

            $categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : null;

            $searchTerm = "%{$query}%";
            $params = [':q1' => $searchTerm, ':q2' => $searchTerm, ':q3' => $searchTerm];

            if ($categoryId && $categoryId > 0) {
                // Search within a specific category
                $sql = "SELECT DISTINCT b.book_id, b.title, b.author, b.isbn, b.publisher,
                               b.publication_year, b.cover_image_path, b.cover_image_url,
                               b.availability_status
                        FROM books b
                        JOIN book_categories bc ON b.book_id = bc.book_id
                        WHERE bc.category_id = :cid
                          AND (b.title LIKE :q1 OR b.author LIKE :q2 OR b.isbn LIKE :q3)
                        ORDER BY b.title ASC
                        LIMIT 50";
                $params[':cid'] = $categoryId;
            } else {
                // Search all books
                $sql = "SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                               b.publication_year, b.cover_image_path, b.cover_image_url,
                               b.availability_status
                        FROM books b
                        WHERE b.title LIKE :q1 OR b.author LIKE :q2 OR b.isbn LIKE :q3
                        ORDER BY b.title ASC
                        LIMIT 50";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
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
