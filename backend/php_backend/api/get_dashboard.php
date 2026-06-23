<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Dashboard API (Aggregated Stats)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Endpoints (dispatched by ?action=):
 *   GET  ?action=stats          — Global aggregate stats (total books, borrows, overdue)
 *   GET  ?action=user_dashboard — Per-user dashboard (?user_id=)
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── Global Stats ────────────────────────────────────────────────
        case 'stats':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $totalBooks = (int) $pdo->query("SELECT COUNT(*) FROM books")->fetchColumn();

            $activeBorrows = (int) $pdo->query(
                "SELECT COUNT(*) FROM borrow_records WHERE status = 'borrowed'"
            )->fetchColumn();

            $overdue = (int) $pdo->query(
                "SELECT COUNT(*) FROM borrow_records
                 WHERE status = 'borrowed' AND due_date < CURDATE()"
            )->fetchColumn();

            jsonSuccess([
                'stats' => [
                    'total_books'    => $totalBooks,
                    'active_borrows' => $activeBorrows,
                    'overdue'        => $overdue,
                ],
            ]);
            break;

        // ── Per-User Dashboard ──────────────────────────────────────────
        case 'user_dashboard':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }

            $userId = (int) ($_GET['user_id'] ?? 0);
            if ($userId <= 0) {
                jsonError('Valid user_id is required', 400);
            }

            // Active reads
            $stmt = $pdo->prepare(
                "SELECT b.book_id, b.title, b.author, b.cover_image_path,
                        br.borrow_date, br.due_date,
                        DATEDIFF(br.due_date, CURDATE()) as days_left
                 FROM borrow_records br
                 JOIN books b ON br.book_id = b.book_id
                 WHERE br.user_id = :uid AND br.status = 'borrowed'"
            );
            $stmt->execute([':uid' => $userId]);
            $activeReads = $stmt->fetchAll();

            foreach ($activeReads as &$read) {
                $read['book_id']   = (int) $read['book_id'];
                $read['days_left'] = (int) $read['days_left'];
            }

            // Total borrowed
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM borrow_records WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $totalBorrowed = (int) $stmt->fetchColumn();

            // Rank
            if ($totalBorrowed < 5) {
                $rank = 'Bronze';
                $level = 1;
            } elseif ($totalBorrowed < 15) {
                $rank = 'Silver';
                $level = 2;
            } else {
                $rank = 'Gold';
                $level = 3;
            }

            jsonSuccess([
                'dashboard' => [
                    'level'          => $level,
                    'rank'           => $rank,
                    'total_borrowed' => $totalBorrowed,
                    'active_reads'   => $activeReads,
                    'unread_notifications' => 3,
                ],
            ]);
            break;

        // ── Featured Books ──────────────────────────────────────────────
        case 'featured_books':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }
            // Just get the latest 5 books as featured for now
            $stmt = $pdo->query(
                "SELECT book_id, title, author, cover_image_path
                 FROM books
                 ORDER BY added_at DESC
                 LIMIT 5"
            );
            $featuredBooks = $stmt->fetchAll();
            jsonSuccess([
                'featured_books' => $featuredBooks,
            ]);
            break;

        // ── Categories ──────────────────────────────────────────────────
        case 'categories':
            if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                jsonError('Method not allowed', 405);
            }
            // Hardcoded categories as there might not be a categories table
            $categories = [
                ['id' => 1, 'name' => 'Technology', 'icon' => 'computer'],
                ['id' => 2, 'name' => 'Fiction', 'icon' => 'auto_stories'],
                ['id' => 3, 'name' => 'Science', 'icon' => 'science'],
                ['id' => 4, 'name' => 'History', 'icon' => 'history'],
                ['id' => 5, 'name' => 'Art', 'icon' => 'palette'],
            ];
            jsonSuccess([
                'categories' => $categories,
            ]);
            break;

        default:
            jsonError('Unknown action. Valid: stats, user_dashboard, featured_books, categories', 400);
    }
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
