<?php
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'history':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $stmt = $pdo->prepare("
                SELECT br.borrow_id, br.borrow_date, br.due_date, br.return_date, br.status, br.fine_amount,
                       b.book_id, b.title, b.author, b.cover_image_path, b.cover_image_url
                FROM borrow_records br
                JOIN books b ON br.book_id = b.book_id
                WHERE br.user_id = :uid
                ORDER BY br.borrow_date DESC
            ");
            $stmt->execute([':uid' => $userId]);
            $history = $stmt->fetchAll();

            foreach ($history as &$record) {
                $record['borrow_id'] = (int) $record['borrow_id'];
                $record['book_id'] = (int) $record['book_id'];
                $record['fine_amount'] = (float) $record['fine_amount'];
            }

            jsonSuccess(['history' => $history]);
            break;

        default:
            jsonError('Unknown action. Valid actions: history', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
