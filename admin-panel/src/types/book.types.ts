/* ══════════════════════════════════════════════════════════════════════════
   Book Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

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
  // Extra fields returned by details endpoint
  category_name?: string | null;
  location_name?: string | null;
  borrowed_by?: string | null;
}

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
  total_copies?: number;
  available_copies?: number | null;
  location_id?: number | null;
  category_ids?: number[];
  synopsis?: string | null;
}

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  language?: string;
  total_copies?: number;
  available_copies?: number;
  location_id?: number | null;
  category_ids?: number[];
  synopsis?: string | null;
}
