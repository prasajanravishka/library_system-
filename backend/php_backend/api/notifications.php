<?php
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $stmt = $pdo->prepare("
                SELECT notification_id, title, message, type, is_read, created_at
                FROM notifications
                WHERE user_id = :uid
                ORDER BY created_at DESC
            ");
            $stmt->execute([':uid' => $userId]);
            $notifications = $stmt->fetchAll();

            foreach ($notifications as &$notif) {
                $notif['notification_id'] = (int) $notif['notification_id'];
                $notif['is_read'] = (bool) $notif['is_read'];
            }

            jsonSuccess(['notifications' => $notifications]);
            break;

        case 'mark_read':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $notificationId = (int) ($data['notification_id'] ?? 0);

            if ($notificationId <= 0) {
                jsonError('Valid notification_id is required', 400);
            }

            $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE notification_id = :nid");
            $stmt->execute([':nid' => $notificationId]);

            jsonSuccess(['message' => 'Notification marked as read']);
            break;

        case 'mark_all_read':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $userId = (int) ($data['user_id'] ?? 0);

            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);

            jsonSuccess(['message' => 'All notifications marked as read']);
            break;

        default:
            jsonError('Unknown action. Valid actions: list, mark_read, mark_all_read', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
