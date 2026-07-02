/* ══════════════════════════════════════════════════════════════════════════
   Borrow Record Types
   ══════════════════════════════════════════════════════════════════════════ */

export interface BorrowRecord {
  borrow_id: number;
  book_id: number;
  title?: string;
  author?: string;
  cover_image_path?: string | null;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
  fine_amount?: number;
  fine_paid?: boolean;
  days_left?: number;
  user_id?: number;
  student_id?: string;
  full_name?: string;
}
