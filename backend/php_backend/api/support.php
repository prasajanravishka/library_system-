<?php
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'my_tickets':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $stmt = $pdo->prepare("
                SELECT ticket_id, subject, message, status, created_at, updated_at
                FROM support_tickets
                WHERE user_id = :uid
                ORDER BY created_at DESC
            ");
            $stmt->execute([':uid' => $userId]);
            $tickets = $stmt->fetchAll();

            foreach ($tickets as &$ticket) {
                $ticket['ticket_id'] = (int) $ticket['ticket_id'];
            }

            jsonSuccess(['tickets' => $tickets]);
            break;

        case 'create_ticket':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $userId = (int) ($data['user_id'] ?? 0);
            $subject = trim($data['subject'] ?? '');
            $message = trim($data['message'] ?? '');

            if ($userId <= 0 || empty($subject) || empty($message)) {
                jsonError('user_id, subject, and message are required', 400);
            }

            $stmt = $pdo->prepare("INSERT INTO support_tickets (user_id, subject, message) VALUES (:uid, :subj, :msg)");
            $stmt->execute([
                ':uid' => $userId,
                ':subj' => $subject,
                ':msg' => $message
            ]);

            jsonSuccess([
                'message' => 'Support ticket created successfully',
                'ticket_id' => (int) $pdo->lastInsertId()
            ], 201);
            break;

        default:
            jsonError('Unknown action. Valid actions: my_tickets, create_ticket', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
