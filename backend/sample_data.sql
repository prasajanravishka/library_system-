-- Smart Library — Rich Sample Seed Data
USE smart_library;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `admins`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `user_settings`;
TRUNCATE TABLE `authors`;
TRUNCATE TABLE `publishers`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `locations`;
TRUNCATE TABLE `books`;
TRUNCATE TABLE `book_categories`;
TRUNCATE TABLE `book_authors`;
TRUNCATE TABLE `book_copies`;
TRUNCATE TABLE `borrow_records`;
TRUNCATE TABLE `fines`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `support_tickets`;
TRUNCATE TABLE `reviews`;
SET FOREIGN_KEY_CHECKS = 1;

-- Seeding `admins`
INSERT INTO `admins` (`admin_id`, `username`, `full_name`, `email`, `password_hash`, `created_at`, `updated_at`) VALUES
(1, 'librarian', 'Head Librarian', 'librarian@library.edu', '$2b$12$SCVCLx9ztK5MmwiwfbPvwOpCtVb69tn4SX4vjakFhDx8dQDCAyRUK', '2026-07-05 12:45:01', '2026-07-05 12:52:39');

-- Seeding `users`
INSERT INTO `users` (`user_id`, `student_id`, `full_name`, `email`, `password_hash`, `profile_image_url`, `account_status`, `rank`, `badge_icon`, `total_books_read`, `created_at`, `updated_at`) VALUES
(1, 'S12345', 'John Doe', 'john@example.com', '$2b$12$SCVCLx9ztK5MmwiwfbPvwOpCtVb69tn4SX4vjakFhDx8dQDCAyRUK', NULL, 'active', 'Bronze', 'military_tech', 2, '2026-07-05 12:45:01', '2026-07-05 12:52:39'),
(2, 'S67890', 'Jane Smith', 'jane@example.com', '$2b$12$SCVCLx9ztK5MmwiwfbPvwOpCtVb69tn4SX4vjakFhDx8dQDCAyRUK', NULL, 'active', 'Silver', 'workspace_premium', 6, '2026-07-05 12:45:01', '2026-07-05 12:52:39'),
(3, 'S11111', 'Bob User', 'bob@example.com', '$2b$12$SCVCLx9ztK5MmwiwfbPvwOpCtVb69tn4SX4vjakFhDx8dQDCAyRUK', NULL, 'suspended', 'Bronze', 'military_tech', 0, '2026-07-05 12:45:01', '2026-07-05 12:52:39'),
(4, 'S22222', 'Alice Green', 'alice@example.com', '$2b$12$SCVCLx9ztK5MmwiwfbPvwOpCtVb69tn4SX4vjakFhDx8dQDCAyRUK', NULL, 'active', 'Gold', 'emoji_events', 16, '2026-07-05 12:45:01', '2026-07-05 12:52:39');

-- Seeding `user_settings`
INSERT INTO `user_settings` (`setting_id`, `user_id`, `push_notifications`, `email_notifications`, `theme_preference`) VALUES
(13, 1, 1, 1, 'light'),
(14, 2, 1, 1, 'dark'),
(15, 3, 0, 0, 'system'),
(16, 4, 1, 1, 'system');

-- Seeding `authors`
INSERT INTO `authors` (`author_id`, `name`, `biography`) VALUES
(1, 'F. Scott Fitzgerald', 'Francis Scott Key Fitzgerald was an American novelist, essayist, and screenwriter.'),
(2, 'George Orwell', 'Eric Arthur Blair, better known by his pen name George Orwell, was an English novelist and essayist.'),
(3, 'Harper Lee', 'Nelle Harper Lee was an American novelist best known for her 1960 novel To Kill a Mockingbird.'),
(4, 'J.D. Salinger', 'Jerome David Salinger was an American writer best known for his novel The Catcher in the Rye.'),
(5, 'Jane Austen', 'Jane Austen was an English novelist known primarily for her six major novels, including Pride and Prejudice.'),
(6, 'Aldous Huxley', 'Aldous Leonard Huxley was an English writer and philosopher.'),
(7, 'J.R.R. Tolkien', 'John Ronald Reuel Tolkien was an English writer, poet, philologist, and academic, best known for The Hobbit.'),
(8, 'Ray Bradbury', 'Ray Douglas Bradbury was an American author and screenwriter, best known for Fahrenheit 451.'),
(9, 'Martin Fowler', 'Martin Fowler is a British software developer, author and international public speaker on software development.'),
(10, 'Marcus Aurelius', 'Marcus Aurelius Antoninus was Roman emperor from 161 to 180 and a Stoic philosopher.');

-- Seeding `publishers`
INSERT INTO `publishers` (`publisher_id`, `name`) VALUES
(3, 'Harper Perennial Modern Classics'),
(4, 'Little, Brown and Company'),
(6, 'Mariner Books'),
(8, 'O''Reilly Media'),
(5, 'Penguin Classics'),
(1, 'Scribner'),
(2, 'Signet Classic'),
(7, 'Simon & Schuster');

-- Seeding `categories`
INSERT INTO `categories` (`category_id`, `name`, `description`, `icon`, `sort_order`, `created_at`) VALUES
(1, 'Technology', 'Programming, Web Development, Databases, and AI.', 'computer', 1, '2026-07-05 12:45:01'),
(2, 'Fiction', 'Classic literature, novels, and storybooks.', 'auto_stories', 2, '2026-07-05 12:45:01'),
(3, 'Science', 'Physics, Chemistry, Biology, and Astronomy.', 'science', 3, '2026-07-05 12:45:01'),
(4, 'Mathematics', 'Algebra, Calculus, Geometry, and Statistics.', 'calculate', 4, '2026-07-05 12:45:01'),
(5, 'Philosophy', 'Stoicism, Ethics, Logic, and Political Thought.', 'psychology', 5, '2026-07-05 12:45:01');

-- Seeding `locations`
INSERT INTO `locations` (`location_id`, `name`, `description`, `created_at`) VALUES
(1, 'East Wing Shelf A', 'General Fiction Section', '2026-07-05 12:45:01'),
(2, 'East Wing Shelf B', 'Classics & Philosophy', '2026-07-05 12:45:01'),
(3, 'West Wing Shelf C', 'Science & Engineering', '2026-07-05 12:45:01'),
(4, 'Reference Section Room 2', 'Textbooks & Math', '2026-07-05 12:45:01');

-- Seeding `books`
INSERT INTO `books` (`book_id`, `title`, `author`, `isbn`, `total_copies`, `available_copies`, `publisher`, `publication_year`, `cover_image_path`, `cover_image_url`, `synopsis`, `language`, `shelf_location`, `availability_status`, `added_by`, `added_at`, `updated_at`, `location_id`, `publisher_id`) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 3, 2, 'Scribner', 1925, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 1),
(2, '1984', 'George Orwell', '9780451524935', 2, 1, 'Signet Classic', 1949, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 2, 2),
(3, 'To Kill a Mockingbird', 'Harper Lee', '9780060935467', 1, 0, 'Harper Perennial Modern Classics', 1960, NULL, NULL, NULL, 'English', NULL, 'borrowed', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 3),
(4, 'The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 2, 2, 'Little, Brown and Company', 1951, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 4),
(5, 'Pride and Prejudice', 'Jane Austen', '9780141439518', 2, 2, 'Penguin Classics', 1813, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 2, 5),
(6, 'Brave New World', 'Aldous Huxley', '9780060850524', 2, 2, 'Harper Perennial', 1932, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 3),
(7, 'The Hobbit', 'J.R.R. Tolkien', '9780547928227', 3, 3, 'Mariner Books', 1937, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 6),
(8, 'Fahrenheit 451', 'Ray Bradbury', '9781451673319', 2, 2, 'Simon & Schuster', 1953, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 1, 7),
(9, 'Refactoring', 'Martin Fowler', '9780134757599', 3, 2, 'O''Reilly Media', 2018, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 3, 8),
(10, 'Meditations', 'Marcus Aurelius', '9780812968255', 2, 1, 'Penguin Classics', 180, NULL, NULL, NULL, 'English', NULL, 'available', 1, '2026-07-05 12:45:01', '2026-07-05 12:45:01', 2, 5);

-- Seeding `book_categories`
INSERT INTO `book_categories` (`book_id`, `category_id`) VALUES
(1, 2),
(2, 2),
(3, 2),
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 1),
(10, 5);

-- Seeding `book_authors`
INSERT INTO `book_authors` (`book_id`, `author_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9),
(10, 10);

-- Seeding `book_copies`
INSERT INTO `book_copies` (`copy_id`, `book_id`, `barcode`, `condition`, `status`, `added_at`) VALUES
(1, 1, 'B1-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(2, 1, 'B1-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(3, 1, 'B1-C3', 'Poor', 'lost', '2026-07-05 12:45:01'),
(4, 2, 'B2-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(5, 2, 'B2-C2', 'Good', 'borrowed', '2026-07-05 12:45:01'),
(6, 3, 'B3-C1', 'Good', 'borrowed', '2026-07-05 12:45:01'),
(7, 4, 'B4-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(8, 4, 'B4-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(9, 5, 'B5-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(10, 5, 'B5-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(11, 6, 'B6-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(12, 6, 'B6-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(13, 7, 'B7-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(14, 7, 'B7-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(15, 7, 'B7-C3', 'Good', 'available', '2026-07-05 12:45:01'),
(16, 8, 'B8-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(17, 8, 'B8-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(18, 9, 'B9-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(19, 9, 'B9-C2', 'Good', 'available', '2026-07-05 12:45:01'),
(20, 9, 'B9-C3', 'Fair', 'maintenance', '2026-07-05 12:45:01'),
(21, 10, 'B10-C1', 'Good', 'available', '2026-07-05 12:45:01'),
(22, 10, 'B10-C2', 'Good', 'borrowed', '2026-07-05 12:45:01');

-- Seeding `borrow_records`
INSERT INTO `borrow_records` (`borrow_id`, `user_id`, `book_id`, `copy_id`, `borrow_date`, `due_date`, `return_date`, `status`, `fine_amount`, `fine_paid`, `created_at`) VALUES
(1, 1, 1, 1, '2026-06-01', '2026-06-15', '2026-06-20', 'returned', '2.50', 1, '2026-07-05 12:45:01'),
(2, 1, 3, 6, '2026-06-10', '2026-06-24', NULL, 'overdue', '5.50', 0, '2026-07-05 12:45:01'),
(3, 2, 2, 5, '2026-06-28', '2026-07-12', NULL, 'borrowed', '0.00', 0, '2026-07-05 12:45:01'),
(4, 4, 10, 22, '2026-07-01', '2026-07-15', NULL, 'borrowed', '0.00', 0, '2026-07-05 12:45:01'),
(5, 4, 7, 14, '2026-06-15', '2026-06-29', '2026-06-25', 'returned', '0.00', 0, '2026-07-05 12:45:01');

-- Seeding `fines`
INSERT INTO `fines` (`fine_id`, `borrow_id`, `amount`, `reason`, `created_at`) VALUES
(1, 1, '2.50', 'Returned 5 days overdue', '2026-07-05 12:45:01'),
(2, 2, '5.50', 'Overdue fine accumulated', '2026-07-05 12:45:01');

-- Seeding `payments`
INSERT INTO `payments` (`payment_id`, `user_id`, `fine_id`, `amount_paid`, `payment_method`, `transaction_reference`, `paid_at`) VALUES
(1, 1, 1, '2.50', 'online', 'TXN-982136', '2026-07-05 12:45:01');

-- Seeding `support_tickets`
INSERT INTO `support_tickets` (`ticket_id`, `user_id`, `subject`, `message`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cannot save book', 'Whenever I click the save button, I get an error.', 'resolved', '2026-07-05 12:45:01', '2026-07-05 12:45:01'),
(2, 2, 'Fine query', 'I was charged a fine but I returned the book on time. Please check.', 'open', '2026-07-05 12:45:01', '2026-07-05 12:45:01'),
(3, 4, 'Book request', 'Could you please purchase the book Clean Code by Robert Martin?', 'open', '2026-07-05 12:45:01', '2026-07-05 12:45:01');

-- Seeding `reviews`
INSERT INTO `reviews` (`review_id`, `user_id`, `book_id`, `rating`, `review_text`, `created_at`) VALUES
(1, 1, 1, 5, 'An absolute masterpiece of American literature. Highly recommended!', '2026-07-05 12:45:01'),
(2, 2, 2, 4, 'A chillingly prophetic view of totalitarianism. A must-read.', '2026-07-05 12:45:01'),
(3, 4, 10, 5, 'Life-changing book. Marcus Aurelius gives incredible stoic advice that is still relevant today.', '2026-07-05 12:45:01');

