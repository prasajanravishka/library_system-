-- ============================================================================
-- Smart Library — Sample Seed Data
-- ============================================================================
-- Passwords: all are bcrypt hashes of 'password123'
-- PHP hash: password_hash('password123', PASSWORD_BCRYPT)
-- ============================================================================

USE smart_library;

-- ── Admin / Librarian ──────────────────────────────────────────────────────

INSERT INTO admins (username, full_name, email, password_hash) VALUES
('librarian', 'Head Librarian', 'librarian@library.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ── Students ───────────────────────────────────────────────────────────────

INSERT INTO users (student_id, full_name, email, password_hash, account_status) VALUES
('S12345', 'John Doe',   'john@example.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('S67890', 'Jane Smith',  'jane@example.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('S11111', 'Bob User',    'bob@example.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'suspended');

-- ── Books ──────────────────────────────────────────────────────────────────

INSERT INTO books (title, author, isbn, publisher, publication_year, availability_status, added_by) VALUES
('The Great Gatsby',        'F. Scott Fitzgerald', '9780743273565', 'Scribner',                          1925, 'available', 1),
('1984',                    'George Orwell',       '9780451524935', 'Signet Classic',                    1949, 'available', 1),
('To Kill a Mockingbird',   'Harper Lee',          '9780060935467', 'Harper Perennial Modern Classics',  1960, 'borrowed',  1),
('The Catcher in the Rye',  'J.D. Salinger',       '9780316769488', 'Little, Brown and Company',         1951, 'available', 1),
('Pride and Prejudice',     'Jane Austen',         '9780141439518', 'Penguin Classics',                  1813, 'available', 1),
('Brave New World',         'Aldous Huxley',       '9780060850524', 'Harper Perennial',                  1932, 'available', 1),
('The Hobbit',              'J.R.R. Tolkien',      '9780547928227', 'Mariner Books',                     1937, 'available', 1),
('Fahrenheit 451',          'Ray Bradbury',        '9781451673319', 'Simon & Schuster',                  1953, 'available', 1);

-- ── Borrow Records ─────────────────────────────────────────────────────────

INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, status) VALUES
(1, 3, '2026-06-01', '2026-06-15', 'overdue'),
(2, 5, '2026-06-18', '2026-07-02', 'borrowed');
