<?php
$dbHost = '127.0.0.1';
$dbName = 'smart_library';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = file_get_contents(__DIR__ . '/migration_v2.sql');
    
    // Split the SQL into individual statements based on ';'
    // This is a naive split but will work for our migration script.
    // However, it's safer to just execute the whole string using multi-queries if possible,
    // but PDO might not support it reliably. Let's just execute the whole thing if emulation is on.
    
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
    $pdo->exec($sql);
    
    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
