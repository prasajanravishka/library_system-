/* ══════════════════════════════════════════════════════════════════════════
   Books API — CRUD operations for the book catalog
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Book, AddBookPayload, UpdateBookPayload } from '../types/book.types';

export const booksApi = {
  /** GET /api/admin/books — List all books (admin-only) */
  getAll: async (): Promise<Book[]> => {
    const { data } = await client.get<{ status: string; books: Book[] }>('/admin/books');
    return data.books;
  },

  /** GET /api/books/{id} — Get book details (public) */
  getById: async (bookId: number): Promise<Book> => {
    const { data } = await client.get<{ status: string; book: Book }>(`/books/${bookId}`);
    return data.book;
  },

  /** POST /api/admin/books — Add a new book */
  create: async (payload: AddBookPayload): Promise<{ book_id: number }> => {
    const { data } = await client.post<{ status: string; message: string; book_id: number }>(
      '/admin/books',
      payload
    );
    return { book_id: data.book_id };
  },

  /** PUT /api/admin/books/{id} — Update an existing book */
  update: async (bookId: number, payload: UpdateBookPayload): Promise<void> => {
    await client.put(`/admin/books/${bookId}`, payload);
  },

  /** DELETE /api/admin/books/{id} — Delete a book */
  delete: async (bookId: number): Promise<void> => {
    await client.delete(`/admin/books/${bookId}`);
  },

  /** GET /api/books/search?q=... — Search books by title/author/ISBN */
  search: async (query: string, categoryId?: number): Promise<Book[]> => {
    const params: Record<string, string | number> = { q: query };
    if (categoryId) params.category_id = categoryId;
    const { data } = await client.get<{ status: string; books: Book[] }>('/books/search', { params });
    return data.books;
  },
};
