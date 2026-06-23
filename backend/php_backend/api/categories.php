<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Categories API
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints (dispatched by ?action=):
 *   GET    ?action=list                    — List all categories with book counts
 *   GET    ?action=books&category_id=      — Books in a specific category
 *   POST   ?action=create                  — Create a new category (Admin)
 *   PUT    ?action=update&category_id=     — Update a category (Admin)
 *   DELETE ?action=delete&category_id=     — Delete a category (Admin)
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create tables if they don't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `categories` (
            `category_id` INT AUTO_INCREMENT PRIMARY KEY,
            `name`        VARCHAR(100) UNIQUE NOT NULL,
            `description` VARCHAR(500),
            `icon`        VARCHAR(50) NOT NULL DEFAULT 'category',
            `sort_order`  INT NOT NULL DEFAULT 0,
            `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `book_categories` (
            `book_id`     INT NOT NULL,
            `category_id` INT NOT NULL,
            PRIMARY KEY (`book_id`, `category_id`),
            FOREIGN KEY (`book_id`)     REFERENCES `books`(`book_id`)         ON DELETE CASCADE,
            FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    // Ignore — tables may already exist
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── List All Categories ─────────────────────────────────────────
        case 'list':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $stmt = $pdo->query(
                "SELECT c.category_id, c.name, c.description, c.icon, c.sort_order,
                        COUNT(bc.book_id) AS book_count
                 FROM categories c
                 LEFT JOIN book_categories bc ON c.category_id = bc.category_id
                 GROUP BY c.category_id
                 ORDER BY c.sort_order ASC, c.name ASC"
            );
            $categories = $stmt->fetchAll();

            foreach ($categories as &$cat) {
                $cat['category_id'] = (int) $cat['category_id'];
                $cat['sort_order']  = (int) $cat['sort_order'];
                $cat['book_count']  = (int) $cat['book_count'];
            }

            jsonSuccess(['categories' => $categories]);
            break;

        // ── Books by Category ───────────────────────────────────────────
        case 'books':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $categoryId = (int) ($_GET['category_id'] ?? 0);
            if ($categoryId <= 0) {
                jsonError('Valid category_id is required', 400);
            }

            // Get category info
            $stmt = $pdo->prepare("SELECT category_id, name, description, icon FROM categories WHERE category_id = :cid");
            $stmt->execute([':cid' => $categoryId]);
            $category = $stmt->fetch();

            if (!$category) {
                jsonError('Category not found', 404);
            }
            $category['category_id'] = (int) $category['category_id'];

            // Get books in this category
            $stmt = $pdo->prepare(
                "SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                        b.publication_year, b.cover_image_path, b.cover_image_url,
                        b.availability_status
                 FROM books b
                 JOIN book_categories bc ON b.book_id = bc.book_id
                 WHERE bc.category_id = :cid
                 ORDER BY b.title ASC"
            );
            $stmt->execute([':cid' => $categoryId]);
            $books = $stmt->fetchAll();

            foreach ($books as &$book) {
                $book['book_id'] = (int) $book['book_id'];
                if ($book['publication_year'] !== null) {
                    $book['publication_year'] = (int) $book['publication_year'];
                }
            }

            jsonSuccess([
                'category' => $category,
                'books'    => $books,
            ]);
            break;

        // ── Create Category (Admin) ─────────────────────────────────────
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('Method not allowed', 405);
            }

            $data = getJsonBody();
            $name = trim($data['name'] ?? '');

            if (empty($name)) {
                jsonError('Category name is required', 400);
            }

            $stmt = $pdo->prepare(
                "INSERT INTO categories (name, description, icon, sort_order)
                 VALUES (:name, :desc, :icon, :sort)"
            );
            $stmt->execute([
                ':name' => $name,
                ':desc' => trim($data['description'] ?? ''),
                ':icon' => trim($data['icon'] ?? 'category'),
                ':sort' => (int) ($data['sort_order'] ?? 0),
            ]);

            jsonSuccess([
                'message'     => 'Category created successfully',
                'category_id' => (int) $pdo->lastInsertId(),
            ], 201);
            break;

        // ── Update Category (Admin) ─────────────────────────────────────
        case 'update':
            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                jsonError('Method not allowed', 405);
            }

            $categoryId = (int) ($_GET['category_id'] ?? 0);
            if ($categoryId <= 0) {
                jsonError('Valid category_id is required', 400);
            }

            $data = getJsonBody();
            $updates = [];
            $params  = [':cid' => $categoryId];

            $allowed = ['name', 'description', 'icon', 'sort_order'];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($updates)) {
                jsonError('No fields to update', 400);
            }

            $sql = "UPDATE categories SET " . implode(', ', $updates) . " WHERE category_id = :cid";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            jsonSuccess(['message' => 'Category updated successfully']);
            break;

        // ── Delete Category (Admin) ─────────────────────────────────────
        case 'delete':
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                jsonError('Method not allowed', 405);
            }

            $categoryId = (int) ($_GET['category_id'] ?? 0);
            if ($categoryId <= 0) {
                jsonError('Valid category_id is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM categories WHERE category_id = :cid");
            $stmt->execute([':cid' => $categoryId]);

            if ($stmt->rowCount() === 0) {
                jsonError('Category not found', 404);
            }

            jsonSuccess(['message' => 'Category deleted successfully']);
            break;

        default:
            jsonError('Unknown action. Valid: list, books, create, update, delete', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
