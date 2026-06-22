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

            // Find active borrow record
            $stmt = $pdo->prepare(
                "SELECT borrow_id FROM borrow_records
                 WHERE user_id = :uid AND book_id = :bid AND status IN ('borrowed', 'overdue')
                 ORDER BY borrow_date DESC LIMIT 1"
            );
            $stmt->execute([':uid' => $userId, ':bid' => $bookId]);
            $borrow = $stmt->fetch();

            if (!$borrow) {
                jsonError('No active borrow record found', 400);
            }

            // Start transaction
            $pdo->beginTransaction();

            // Update borrow record
            $stmt = $pdo->prepare(
                "UPDATE borrow_records SET status = 'returned', return_date = CURDATE()
                 WHERE borrow_id = :brid"
            );
            $stmt->execute([':brid' => $borrow['borrow_id']]);

            // Update book availability
            $stmt = $pdo->prepare("UPDATE books SET availability_status = 'available' WHERE book_id = :bid");
            $stmt->execute([':bid' => $bookId]);

            $pdo->commit();

            jsonSuccess(['message' => 'Book returned successfully']);
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
