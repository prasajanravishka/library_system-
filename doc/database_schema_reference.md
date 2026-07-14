# Database Architecture & Schema Reference

The `smart_library` database is built on a relational architecture. This schema natively supports physical location tracking, individual copy barcode tracking, gamification, and complex many-to-many relationships for categorization. All foreign keys should be properly indexed to ensure query performance across large datasets.

Below is the complete architectural overview and schema breakdown of the production structure, detailing all 18 tables.

---

## Architectural Diagram

```mermaid
erDiagram
    ADMINS ||--o{ BOOKS : "added_by"
    USERS ||--o{ BORROW_RECORDS : "user_id"
    BOOKS ||--o{ BORROW_RECORDS : "book_id"
    BOOK_COPIES ||--o{ BORROW_RECORDS : "copy_id"
    BOOKS ||--o{ BOOK_CATEGORIES : "book_id"
    CATEGORIES ||--o{ BOOK_CATEGORIES : "category_id"
    LOCATIONS ||--o{ BOOKS : "location_id"
    BOOKS ||--o{ BOOK_COPIES : "book_id"
    AUTHORS ||--o{ BOOK_AUTHORS : "author_id"
    BOOKS ||--o{ BOOK_AUTHORS : "book_id"
    PUBLISHERS ||--o{ BOOKS : "publisher_id"
    BORROW_RECORDS ||--o{ FINES : "borrow_id"
    USERS ||--o{ NOTIFICATIONS : "user_id"
    USERS ||--o{ PAYMENTS : "user_id"
    FINES ||--o{ PAYMENTS : "fine_id"
    USERS ||--o{ REVIEWS : "user_id"
    BOOKS ||--o{ REVIEWS : "book_id"
    USERS ||--o{ SAVED_BOOKS : "user_id"
    BOOKS ||--o{ SAVED_BOOKS : "book_id"
    USERS ||--o{ SUPPORT_TICKETS : "user_id"
    USERS ||--|| USER_SETTINGS : "user_id"

    ADMINS {
        int admin_id PK
        string username
        string password_hash
    }
    AUTHORS {
        int author_id PK
        string name
    }
    BOOK_AUTHORS {
        int book_id PK, FK
        int author_id PK, FK
    }
    USERS {
        int user_id PK
        string student_id
        string account_status
        int total_books_read
    }
    BOOKS {
        int book_id PK
        string title
        int total_copies
        int location_id FK
        int publisher_id FK
    }
    BOOK_COPIES {
        int copy_id PK
        int book_id FK
        string barcode
        string status
    }
    LOCATIONS {
        int location_id PK
        string name
    }
    BORROW_RECORDS {
        int borrow_id PK
        int user_id FK
        int book_id FK
        int copy_id FK
        date borrow_date
        date due_date
        date return_date
    }
    CATEGORIES {
        int category_id PK
        string name
    }
    BOOK_CATEGORIES {
        int book_id PK, FK
        int category_id PK, FK
    }
    FINES {
        int fine_id PK
        int borrow_id FK
        decimal amount
    }
    PAYMENTS {
        int payment_id PK
        int user_id FK
        int fine_id FK
        decimal amount_paid
    }
    PUBLISHERS {
        int publisher_id PK
        string name
    }
    REVIEWS {
        int review_id PK
        int user_id FK
        int book_id FK
        int rating
    }
    SAVED_BOOKS {
        int user_id PK, FK
        int book_id PK, FK
    }
    SUPPORT_TICKETS {
        int ticket_id PK
        int user_id FK
        string subject
    }
    USER_SETTINGS {
        int setting_id PK
        int user_id FK
        boolean push_notifications
    }
    NOTIFICATIONS {
        int notification_id PK
        int user_id FK
        string title
    }
```

---

## Entity Definitions

### 1. `admins` (Librarians & Staff)
Stores the credentials and metadata for library administrators.
*   **`admin_id`**: Primary Key.
*   **`username`, `email`**: Unique identifiers for authentication.
*   **`password_hash`**: Securely hashed password (bcrypt).

### 2. `users` (Students & Patrons)
Stores all patron records, handling authentication states and gamification metrics.
*   **`user_id`**: Primary Key.
*   **`student_id`, `email`**: Unique identifiers.
*   **`account_status`**: Enum (`active` or `suspended`).
*   **`rank`, `total_books_read`**: Gamification and engagement tracking.

### 3. `books` (Global Inventory Catalog)
The core catalog table for all titles within the library network.
*   **`book_id`**: Primary Key.
*   **`title`, `author`, `keywords`**: Core metadata and discovery tags (Optimized with a `FULLTEXT` index for performance).
*   **`total_copies`, `available_copies`**: Aggregated quantities based on linked `book_copies`.
*   **`publisher`, `publication_year`, `language`**: Extended descriptive metadata.
*   **`location_id`, `publisher_id`**: Foreign Keys linking to `locations` and `publishers`.
*   **`cover_image_url`**: Path/URL to the digitized cover art.
*   **`availability_status`**: Enum (`available`, `borrowed`, `lost`).

### 4. `book_copies` (Physical Tracking)
Tracks individual physical items within the library, allowing granular condition and availability monitoring.
*   **`copy_id`**: Primary Key.
*   **`book_id`**: Foreign Key tying the physical item to the logical book metadata.
*   **`barcode`**: Unique identifier (e.g., physical ISBN, RFID, or barcode scan).
*   **`condition`**: Physical state of the item (`New`, `Good`, `Damaged`, etc.).
*   **`status`**: Current physical status (`available`, `borrowed`, `lost`, `maintenance`).

### 5. `locations` (Physical Placement)
Provides logical zoning for physical placement of resources.
*   **`location_id`**: Primary Key.
*   **`name`**: Identifiable name of the physical location (e.g., "Reference Section", "Floor 1 Shelf A").
*   **`description`**: Additional details to guide patrons.

### 6. `borrow_records` (Transactional Ledger)
The immutable ledger tracking all checkouts, returns, and financial penalties.
*   **`borrow_id`**: Primary Key.
*   **`user_id`, `book_id`, `copy_id`**: Foreign Keys linking the transaction actor to the exact physical item.
*   **`borrow_date`, `due_date`, `return_date`**: Chronological tracking points.
*   **`status`**: Enum (`borrowed`, `returned`, `overdue`, `lost`).
*   **`fine_amount`, `fine_paid`**: Financial accountability for overdue resources.

### 7. `categories` & `book_categories` (Taxonomy)
Defines the overarching genres and subjects available in the discovery UI. `book_categories` resolves the many-to-many mapping.
*   **`category_id`**: Primary Key.
*   **`name`**: Genre denomination (e.g., "Science Fiction").
*   **`icon`**: UI icon identifier.

### 8. `authors` & `book_authors` (Attribution)
Stores author biographies and handles the many-to-many relationship with books.

### 9. `publishers` (Publishing Entities)
Tracks unique publishing entities linked to books via `publisher_id`.

### 10. `fines` & `payments` (Financials)
Financial tracking modules. `fines` are generated from overdue `borrow_records`, and `payments` settle those fines via various methods (cash, card, online).

### 11. `reviews` & `saved_books` (Social & Gamification)
Social and gamification features allowing users to rate, review, and bookmark (`saved_books`) items in the catalog.

### 12. `support_tickets` (Help Desk)
Tracks help desk queries raised by users. Status tracking for open/resolved issues.

### 13. `user_settings` (Preferences)
Handles user preferences for notifications and UI theme toggles, linked 1:1 with `users`.

### 14. `notifications` (Alerts)
System alerts sent to users for overdues, fine generation, and general announcements.
