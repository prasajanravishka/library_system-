/* ══════════════════════════════════════════════════════════════════════════
   Book Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Represents a physical copy of a book.
 */
export interface BookCopy {
  copy_id?: number;
  barcode: string;
  condition?: 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  status?: 'available' | 'borrowed' | 'lost' | 'maintenance';
  added_at?: string;
}

/**
 * Represents a historical borrow record.
 */
export interface BorrowHistory {
  borrow_id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
  fine_amount: string | number;
  fine_paid: number | boolean;
  user_name: string;
  barcode: string | null;
}

/**
 * Represents a user review for a book.
 */
export interface Review {
  review_id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_name: string;
}

/**
 * Represents a Book entity with all its details.
 */
export interface Book {
  book_id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  language: string;
  total_copies: number;
  available_copies: number;
  location_id: number | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  availability_status: 'available' | 'borrowed' | 'lost';
  added_at?: string;
  synopsis?: string | null;
  shelf_location?: string | null;
  keywords?: string;
  // Extra fields returned by details endpoint
  category_name?: string | null;
  location_name?: string | null;
  borrowed_by?: string | null;
  copies?: BookCopy[];
  history?: BorrowHistory[];
  reviews?: Review[];
}

/**
 * Payload required for adding a new book.
 */
export interface AddBookPayload {
  title: string;
  author?: string;
  isbn?: string | null;
  publisher?: string;
  publication_year?: number | null;
  language?: string;
  cover_image_path?: string;
  cover_image_url?: string;
  added_by?: number | null;
  location_id?: number | null;
  category_ids?: number[];
  synopsis?: string | null;
  keywords?: string | null;
  copies?: BookCopy[];
}

/**
 * Payload required for updating an existing book.
 */
export interface UpdateBookPayload {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  language?: string;
  location_id?: number | null;
  category_ids?: number[];
  synopsis?: string | null;
  keywords?: string | null;
  copies?: BookCopy[];
}
