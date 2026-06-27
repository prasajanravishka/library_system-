<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Book Location Setup Script
 * ════════════════════════════════════════════════════════════════════════════
 */

// Include the database connection. 
// Adjust the path as necessary depending on where you run this file.
require_once __DIR__ . '/../api/db_connect.php';

echo "Starting Book Location Table Setup...\n";

try {
    $sql = "ALTER TABLE locations 
            ADD COLUMN IF NOT EXISTS floor VARCHAR(50) NULL AFTER description,
            ADD COLUMN IF NOT EXISTS section VARCHAR(100) NULL AFTER floor,
            ADD COLUMN IF NOT EXISTS shelf_number VARCHAR(50) NULL AFTER section";
    
    $pdo->exec($sql);
    
    echo "[SUCCESS] Table 'locations' upgraded successfully.\n";
} catch (PDOException $e) {
    echo "[ERROR] Failed to create table: " . $e->getMessage() . "\n";
}
