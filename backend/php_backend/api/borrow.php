<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Borrow API (Checkout & Returns)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints (dispatched by ?action=):
 *   POST  ?action=borrow     — Borrow a book (checkout)
 *   POST  ?action=return     — Return a borrowed book
 *   GET   ?action=history    — Full borrow history for a user (?user_id=)
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create borrow_records table if it doesn't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `borrow_records` (
            `borrow_id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `book_id` INT NOT NULL,
            `borrow_date` DATE NOT NULL,
            `due_date` DATE NOT NULL,
            `return_date` DATE NULL,
            `status` ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed',
            FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
            FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    // Ignore if it fails due to existing table, permissions, or missing parent tables
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── Borrow (Checkout) ───────────────────────────────────────────
        case 'borrow':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data   = getJsonBody();
            $userId = (int) ($data['user_id'] ?? 0);
            $bookId = (int) ($data['book_id'] ?? 0);

            if ($userId <= 0 || $bookId <= 0) {
                jsonError('Valid user_id and book_id are required', 400);
            }

            // Check book availability
            $stmt = $pdo->prepare("SELECT availability_status FROM books WHERE book_id = :bid");
            $stmt->execute([':bid' => $bookId]);
            $book = $stmt->fetch();

            if (!$book) {
                jsonError('Book not found', 404);
            }
            if ($book['availability_status'] !== 'available') {
                jsonError('Book is not available for borrowing', 400);
            }

            // Start transaction
            $pdo->beginTransaction();

            // Insert borrow record (14-day loan period)
            $stmt = $pdo->prepare(
                "INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, status)
                 VALUES (:uid, :bid, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'borrowed')"
            );
            $stmt->execute([':uid' => $userId, ':bid' => $bookId]);
            $borrowId = (int) $pdo->lastInsertId();

            // Update book status
            $stmt = $pdo->prepare("UPDATE books SET availability_status = 'borrowed' WHERE book_id = :bid");
            $stmt->execute([':bid' => $bookId]);

            $pdo->commit();

            // Calculate due date for response
            $dueDate = date('Y-m-d', strtotime('+14 days'));

            jsonSuccess([
                'message'   => 'Book borrowed successfully',
                'borrow_id' => $borrowId,
                'due_date'  => $dueDate,
            ]);
            break;

        // ── Return ──────────────────────────────────────────────────────
        case 'return':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data   = getJsonBody();
            $userId = (int) ($data['user_id'] ?? 0);
            $bookId = (int) ($data['book_id'] ?? 0);

            if ($userId <= 0 || $bookId <= 0) {
                jsonError('Valid user_id and book_id are required', 400);
            }

            // Find active borrow record (include due_date for fine calc)
            $stmt = $pdo->prepare(
                "SELECT borrow_id, due_date FROM borrow_records
                 WHERE user_id = :uid AND book_id = :bid AND status IN ('borrowed', 'overdue')
                 ORDER BY borrow_date DESC LIMIT 1"
            );
            $stmt->execute([':uid' => $userId, ':bid' => $bookId]);
            $borrow = $stmt->fetch();

            if (!$borrow) {
                jsonError('No active borrow record found', 400);
            }

            // Calculate fine if overdue ($0.50 per day)
            $finePerDay = 0.50;
            $daysOverdue = max(0, (int) ((new DateTime())->diff(new DateTime($borrow['due_date']))->format('%r%a')));
            $isOverdue = new DateTime() > new DateTime($borrow['due_date']);
            $fineAmount = $isOverdue ? round($daysOverdue * $finePerDay, 2) : 0.00;

            // Start transaction
            $pdo->beginTransaction();

            // Update borrow record with return date and fine
            $stmt = $pdo->prepare(
                "UPDATE borrow_records
                 SET status = 'returned', return_date = CURDATE(),
                     fine_amount = :fine, fine_paid = FALSE
                 WHERE borrow_id = :brid"
            );
            $stmt->execute([':brid' => $borrow['borrow_id'], ':fine' => $fineAmount]);

            // Update book availability
            $stmt = $pdo->prepare("UPDATE books SET availability_status = 'available' WHERE book_id = :bid");
            $stmt->execute([':bid' => $bookId]);

            // Update user rank/badge based on new total
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM borrow_records WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $totalBorrowed = (int) $stmt->fetchColumn();

            if ($totalBorrowed >= 15) {
                $rank = 'Gold'; $badge = 'emoji_events';
            } elseif ($totalBorrowed >= 5) {
                $rank = 'Silver'; $badge = 'workspace_premium';
            } else {
                $rank = 'Bronze'; $badge = 'military_tech';
            }

            $stmt = $pdo->prepare(
                "UPDATE users SET `rank` = :rank, badge_icon = :badge, total_books_read = :total
                 WHERE user_id = :uid"
            );
            $stmt->execute([':rank' => $rank, ':badge' => $badge, ':total' => $totalBorrowed, ':uid' => $userId]);

            $pdo->commit();

            $response = ['message' => 'Book returned successfully'];
            if ($fineAmount > 0) {
                $response['fine_amount'] = $fineAmount;
                $response['fine_message'] = "Overdue fine of \${$fineAmount} has been applied.";
            }
            jsonSuccess($response);
            break;

        // ── Borrow History ──────────────────────────────────────────────
        case 'history':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $stmt = $pdo->prepare(
                "SELECT br.borrow_id, b.book_id, b.title, b.author, b.cover_image_path,
                        br.borrow_date, br.due_date, br.return_date, br.status,
                        DATEDIFF(br.due_date, CURDATE()) as days_left
                 FROM borrow_records br
                 JOIN books b ON br.book_id = b.book_id
                 WHERE br.user_id = :uid
                 ORDER BY br.borrow_date DESC"
            );
            $stmt->execute([':uid' => $userId]);
            $records = $stmt->fetchAll();

            // Cast types
            foreach ($records as &$rec) {
                $rec['borrow_id'] = (int) $rec['borrow_id'];
                $rec['book_id']   = (int) $rec['book_id'];
                $rec['days_left'] = (int) $rec['days_left'];
            }

            jsonSuccess(['library' => $records]);
            break;

        default:
            jsonError('Unknown action. Valid: borrow, return, history', 400);
    }
} catch (PDOException $e) {
    $pdo->rollBack();
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
