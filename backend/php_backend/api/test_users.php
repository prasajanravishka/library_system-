<?php
/**
 * Test endpoint to verify end-to-end database connectivity.
 * Fetches all registered users from the database.
 */

require_once __DIR__ . '/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

try {
    // db_connect.php already validates the X-API-Key header.
    // If we reach here, we are authorized.

    $stmt = $pdo->query("SELECT user_id, student_id, full_name, email, role, account_status, created_at FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonSuccess([
        'message' => 'Database connection successful',
        'users' => $users,
        'count' => count($users)
    ]);

} catch (PDOException $e) {
    // Return SQL errors as JSON for easy debugging
    jsonError('Database connection or query failed: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Unexpected error: ' . $e->getMessage(), 500);
}
