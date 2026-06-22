<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Book Details API
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   GET  ?book_id=<id>  — Fetch full details for a specific book
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$bookId = (int) ($_GET['book_id'] ?? 0);
if ($bookId <= 0) {
    jsonError('Valid book_id parameter is required', 400);
}

try {
    // Book details
    $stmt = $pdo->prepare(
        "SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                b.publication_year, b.cover_image_path, b.availability_status,
                b.added_at, a.full_name as added_by_name
         FROM books b
         LEFT JOIN admins a ON b.added_by = a.admin_id
         WHERE b.book_id = :bid"
    );
    $stmt->execute([':bid' => $bookId]);
    $book = $stmt->fetch();

    if (!$book) {
        jsonError('Book not found', 404);
    }

    $book['book_id'] = (int) $book['book_id'];
    if ($book['publication_year'] !== null) {
        $book['publication_year'] = (int) $book['publication_year'];
    }

    // Borrow history for this book (last 10)
    $stmt = $pdo->prepare(
        "SELECT br.borrow_id, u.full_name as borrower_name, u.student_id,
                br.borrow_date, br.due_date, br.return_date, br.status
         FROM borrow_records br
         JOIN users u ON br.user_id = u.user_id
         WHERE br.book_id = :bid
         ORDER BY br.borrow_date DESC
         LIMIT 10"
    );
    $stmt->execute([':bid' => $bookId]);
    $history = $stmt->fetchAll();

    foreach ($history as &$h) {
        $h['borrow_id'] = (int) $h['borrow_id'];
    }

    jsonSuccess([
        'book'    => $book,
        'history' => $history,
    ]);

} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
