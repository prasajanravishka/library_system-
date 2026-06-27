<?php
if (php_sapi_name() !== 'cli') die("CLI only");
$_SERVER['HTTP_X_API_KEY'] = 'LIBRARY_SECRET_API_KEY_2026';
require_once __DIR__ . '/db_connect.php';
try {
    $pdo->exec("ALTER TABLE books ADD FULLTEXT INDEX ft_idx_books (title, author, isbn)");
    echo "Index added.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
        echo "Index already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
