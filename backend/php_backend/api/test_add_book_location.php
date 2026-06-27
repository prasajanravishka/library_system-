<?php
$_SERVER['HTTP_X_API_KEY'] = 'LIBRARY_SECRET_API_KEY_2026';
$_SERVER['REQUEST_METHOD'] = 'POST';
$json = json_encode([
    'title' => 'Test Location Book',
    'author' => 'Agent Antigravity',
    'isbn' => '123-456-789',
    'publisher' => 'AI Press',
    'publication_year' => 2026,
    'language' => 'English',
    'total_copies' => 5,
    'available_copies' => 5,
    'location_id' => null, // null until we create a location
    'added_by' => 1
]);
// Overwrite file_get_contents to mock php://input
if (!function_exists('getJsonBody')) {
    function getJsonBody() {
        global $json;
        return json_decode($json, true);
    }
}
$action = 'add_book';
try {
    require_once __DIR__ . '/admin.php';
} catch (Exception $e) {
    echo $e->getMessage();
}
