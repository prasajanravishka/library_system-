import client from './client';

export interface AdminBorrowRecord {
  borrow_id: number;
  user_id: number;
  book_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  fine_amount: number;
  fine_paid: boolean;
  title: string;
  author: string | null;
  student_id: string;
  full_name: string;
}

export const borrowsApi = {
  getAll: async (): Promise<AdminBorrowRecord[]> => {
    const { data } = await client.get<{ status: string; borrows: AdminBorrowRecord[] }>('/admin/borrows');
    return data.borrows;
  },

  returnBook: async (borrowId: number): Promise<void> => {
    await client.put(`/admin/borrows/${borrowId}/return`);
  },

  checkout: async (student_id: string, book_id: number): Promise<void> => {
    await client.post('/admin/circulation/checkout', { student_id, book_id });
  },

  checkin: async (student_id: string, book_id: number): Promise<void> => {
    await client.post('/admin/circulation/checkin', { student_id, book_id });
  },
};
