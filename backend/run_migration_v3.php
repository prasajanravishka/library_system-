<?php
$dbHost = '127.0.0.1';
$dbName = 'smart_library';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = file_get_contents(__DIR__ . '/migration_v3.sql');
    
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
    $pdo->exec($sql);
    
    echo "Migration V3 completed successfully.\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
