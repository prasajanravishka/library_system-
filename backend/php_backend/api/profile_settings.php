<?php
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_settings':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            // Get user settings, create defaults if missing
            $stmt = $pdo->prepare("SELECT push_notifications, email_notifications, theme_preference FROM user_settings WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $settings = $stmt->fetch();

            if (!$settings) {
                // Insert defaults
                $stmt = $pdo->prepare("INSERT INTO user_settings (user_id) VALUES (:uid)");
                $stmt->execute([':uid' => $userId]);
                $settings = [
                    'push_notifications' => 1,
                    'email_notifications' => 1,
                    'theme_preference' => 'system'
                ];
            }

            // Cast booleans
            $settings['push_notifications'] = (bool) $settings['push_notifications'];
            $settings['email_notifications'] = (bool) $settings['email_notifications'];

            jsonSuccess(['settings' => $settings]);
            break;

        case 'update_settings':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $userId = (int) ($data['user_id'] ?? 0);

            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            $pdo->beginTransaction();

            if (isset($data['full_name'])) {
                $stmt = $pdo->prepare("UPDATE users SET full_name = :fname WHERE user_id = :uid");
                $stmt->execute([':fname' => $data['full_name'], ':uid' => $userId]);
            }

            $push = isset($data['push_notifications']) ? (int)$data['push_notifications'] : 1;
            $email = isset($data['email_notifications']) ? (int)$data['email_notifications'] : 1;
            $theme = $data['theme_preference'] ?? 'system';

            $stmt = $pdo->prepare("
                INSERT INTO user_settings (user_id, push_notifications, email_notifications, theme_preference)
                VALUES (:uid, :push, :email, :theme)
                ON DUPLICATE KEY UPDATE 
                push_notifications = :push2, 
                email_notifications = :email2, 
                theme_preference = :theme2
            ");
            
            $stmt->execute([
                ':uid' => $userId,
                ':push' => $push,
                ':email' => $email,
                ':theme' => $theme,
                ':push2' => $push,
                ':email2' => $email,
                ':theme2' => $theme
            ]);

            $pdo->commit();
            jsonSuccess(['message' => 'Settings updated successfully']);
            break;

        default:
            jsonError('Unknown action. Valid actions: get_settings, update_settings', 400);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonError('Server error: ' . $e->getMessage(), 500);
}
