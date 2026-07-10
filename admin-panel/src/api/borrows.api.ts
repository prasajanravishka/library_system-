import client from './client';

/**
 * Interface representing a detailed borrow record for admins.
 */
export interface AdminBorrowRecord {
  /** Unique identifier for the borrow record */
  borrow_id: number;
  /** Internal ID of the user who borrowed */
  user_id: number;
  /** ID of the borrowed book */
  book_id: number;
  /** Date the book was borrowed */
  borrow_date: string;
  /** Date the book is due */
  due_date: string;
  /** Date the book was actually returned, or null if not yet returned */
  return_date: string | null;
  /** Current status (e.g., 'active', 'returned', 'overdue') */
  status: string;
  /** Accrued fine amount, if any */
  fine_amount: number;
  /** Indicates if the fine has been paid */
  fine_paid: boolean;
  /** Title of the borrowed book */
  title: string;
  /** Author of the borrowed book */
  author: string | null;
  /** Student ID string (e.g., matriculation number) */
  student_id: string;
  /** Full name of the student/user */
  full_name: string;
}

/**
 * Borrows API methods
 * Manages book circulation, checkouts, checkins, and borrow records.
 */
export const borrowsApi = {
  /**
   * Retrieves all borrow records across the library.
   * 
   * @returns A promise that resolves to an array of AdminBorrowRecord objects
   */
  getAll: async (): Promise<AdminBorrowRecord[]> => {
    // Fetch the list of all borrows from the admin endpoint
    const { data } = await client.get<{ status: string; borrows: AdminBorrowRecord[] }>('/admin/borrows');
    // Extract and return the borrows array
    return data.borrows;
  },

  /**
   * Retrieves all fine records (borrow records where fine_amount > 0).
   * 
   * @returns A promise that resolves to an array of AdminBorrowRecord objects
   */
  getFines: async (): Promise<AdminBorrowRecord[]> => {
    const { data } = await client.get<{ status: string; fines: AdminBorrowRecord[] }>('/admin/fines');
    return data.fines;
  },

  /**
   * Processes the return of a borrowed book by its borrow ID.
   * 
   * @param borrowId - The unique identifier of the borrow record
   * @returns A promise that resolves when the return completes
   */
  returnBook: async (borrowId: number): Promise<void> => {
    // Send a PUT request to update the borrow record status to returned
    await client.put(`/admin/borrows/${borrowId}/return`);
  },

  /**
   * Checks out a book to a student.
   * 
   * @param student_id - The student ID of the borrower
   * @param book_id - The ID of the book being borrowed
   * @param due_date - Optional custom due date (YYYY-MM-DD)
   * @param barcode - Optional barcode of the specific physical copy
   * @returns A promise that resolves when the checkout completes
   */
  checkout: async (student_id: string, book_id: number, due_date?: string, barcode?: string): Promise<void> => {
    // Send checkout request payload containing student, book, optional custom due date, and specific physical barcode
    await client.post('/admin/circulation/checkout', { student_id, book_id, due_date, barcode });
  },

  /**
   * Checks in (returns) a book from a student via circulation desk.
   * 
   * @param student_id - The student ID of the borrower
   * @param book_id - The ID of the book being returned
   * @returns A promise that resolves when the checkin completes
   */
  checkin: async (student_id: string, book_id: number): Promise<void> => {
    // Send checkin request payload to process book return
    await client.post('/admin/circulation/checkin', { student_id, book_id });
  },

  /**
   * Marks a fine as paid for a specific borrow record.
   * 
   * @param borrowId - The unique identifier of the borrow record
   * @returns A promise that resolves when the payment is recorded
   */
  payFine: async (borrowId: number): Promise<void> => {
    // Send a PUT request to update the fine_paid status
    await client.put(`/admin/borrows/${borrowId}/pay-fine`);
  },
};
