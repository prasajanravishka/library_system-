# Database Architecture & Schema Reference

The `smart_library` database is built on a relational architecture. This schema natively supports physical location tracking, individual copy barcode tracking, gamification, and complex many-to-many relationships for categorization.

Below is the complete architectural overview and schema breakdown of the production structure.

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

    ADMINS {
        int admin_id PK
        string username
        string email
        string password_hash
    }
    
    USERS {
        int user_id PK
        string student_id
        string full_name
        string email
        string account_status
        string rank
        int total_books_read
    }
    
    BOOKS {
        int book_id PK
        string title
        string author
        int total_copies
        int available_copies
        string publisher
        int publication_year
        string language
        int location_id FK
        string availability_status
        int added_by FK
    }
    
    BOOK_COPIES {
        int copy_id PK
        int book_id FK
        string barcode
        string condition
        string status
    }
    
    LOCATIONS {
        int location_id PK
        string name
        string description
    }
    
    BORROW_RECORDS {
        int borrow_id PK
        int user_id FK
        int book_id FK
        int copy_id FK
        date borrow_date
        date due_date
        string status
        decimal fine_amount
        boolean fine_paid
    }

    CATEGORIES {
        int category_id PK
        string name
        string icon
        int sort_order
    }
    
    BOOK_CATEGORIES {
        int book_id PK, FK
        int category_id PK, FK
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
*   **`title`, `author`**: Core metadata (Optimized with a `FULLTEXT` index for performance).
*   **`total_copies`, `available_copies`**: Aggregated quantities based on linked `book_copies`.
*   **`publisher`, `publication_year`, `language`**: Extended descriptive metadata.
*   **`location_id`**: Foreign Key linking to `locations` for physical area tracking.
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

### 7. `categories` (Taxonomy)
Defines the overarching genres and subjects available in the discovery UI.
*   **`category_id`**: Primary Key.
*   **`name`**: Genre denomination (e.g., "Science Fiction").
*   **`icon`**: UI icon identifier.
*   **`sort_order`**: Deterministic display ordering for the dashboard.

### 8. `book_categories` (Junction Table)
Resolves the many-to-many relationship between books and categories.
*   **`book_id`**: Foreign Key.
*   **`category_id`**: Foreign Key.
