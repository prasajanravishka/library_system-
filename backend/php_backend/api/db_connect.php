<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library Management System — Database Connection & API Key Auth
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Usage: Include this file at the top of every API endpoint.
 *        It provides:
 *          1. $pdo  — A configured PDO MySQL connection
 *          2. API Key verification (rejects unauthorized requests)
 *          3. JSON response helpers
 *
 * All responses are returned as JSON with appropriate HTTP status codes.
 * ════════════════════════════════════════════════════════════════════════════
 */

// ── CORS Headers (allow Flutter app to connect) ─────────────────────────────

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, x-api-key, X-API-Key");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── API Key Configuration ───────────────────────────────────────────────────

define('API_KEY', 'LIBRARY_SECRET_API_KEY_2026');

// Polyfill for CLI
if (!function_exists('getallheaders')) {
    function getallheaders() {
        return [];
    }
}

/**
 * Validate the API key from the x-api-key header.
 * Rejects unauthorized requests with 401 status.
 * Setup script is allowed without API key for initial database setup.
 */
function validateApiKey(): void {
    // Skip validation for setup.php and create_user.php (admin tools)
    $currentFile = basename($_SERVER['SCRIPT_FILENAME'] ?? '');
    if ($currentFile === 'setup.php' || $currentFile === 'create_user.php') {
        return;
    }

    // Skip validation if explicitly running from CLI and key is set in $_SERVER
    if (php_sapi_name() === 'cli' && ($_SERVER['HTTP_X_API_KEY'] ?? '') === API_KEY) {
        return;
    }

    $headers = getallheaders();
    // Header keys may vary in case across servers
    $apiKey = $headers['x-api-key'] ?? $headers['X-Api-Key'] ?? $headers['X-API-KEY'] ?? $headers['X-API-Key'] ?? '';

    if ($apiKey !== API_KEY) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Unauthorized — invalid or missing API key'
        ]);
        exit();
    }
}

// Enforce API key on every request
validateApiKey();

// ── Database Configuration ──────────────────────────────────────────────────

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'smart_library');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Create and return a PDO MySQL connection.
 * Uses persistent connections for performance.
 * Throws are caught by the calling endpoint's try/catch.
 */
function getDbConnection(): PDO {
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_PERSISTENT         => true,
    ];

    // 1. Connect to MySQL without specifying a database
    $dsnWithoutDb = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
    $tempPdo = new PDO($dsnWithoutDb, DB_USER, DB_PASS, $options);

    // 2. Create the database if it doesn't exist
    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET " . DB_CHARSET . " COLLATE utf8mb4_unicode_ci");

    // 3. Connect to the specific database
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

    return $pdo;
}

// Initialize the global PDO connection
try {
    $pdo = getDbConnection();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// ── JSON Response Helpers ───────────────────────────────────────────────────

/**
 * Send a success JSON response.
 */
function jsonSuccess(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode(array_merge(['status' => 'success'], $data));
    exit();
}

/**
 * Send an error JSON response.
 */
function jsonError(string $message, int $statusCode = 400): void {
    http_response_code($statusCode);
    echo json_encode([
        'status'  => 'error',
        'message' => $message
    ]);
    exit();
}

/**
 * Get the JSON body from a POST/PUT request.
 */
function getJsonBody(): array {
    $rawBody = file_get_contents('php://input');
    $data = json_decode($rawBody, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Invalid JSON in request body', 400);
    }

    return $data ?? [];
}
