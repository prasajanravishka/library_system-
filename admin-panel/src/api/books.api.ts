/* ══════════════════════════════════════════════════════════════════════════
   Books API — CRUD operations for the book catalog
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Book, AddBookPayload, UpdateBookPayload } from '../types/book.types';

/**
 * Books API methods
 * Handles all book-related operations including retrieval, creation, updates, and deletion.
 */
export const booksApi = {
  /** 
   * Retrieves all books in the catalog.
   * GET /api/admin/books — List all books (admin-only) 
   * 
   * @returns A promise that resolves to an array of Book objects
   */
  getAll: async (): Promise<Book[]> => {
    // Fetch books from the admin endpoint
    const { data } = await client.get<{ status: string; books: Book[] }>('/admin/books');
    // Extract and return the books array from the response
    return data.books;
  },

  /** 
   * Retrieves detailed information for a specific book.
   * GET /api/books/{id} — Get book details (public) 
   * 
   * @param bookId - The unique identifier of the book
   * @returns A promise that resolves to the Book object
   */
  getById: async (bookId: number): Promise<Book> => {
    // Fetch a single book's details by ID
    const { data } = await client.get<{ status: string; book: Book }>(`/books/${bookId}`);
    // Extract and return the book object from the response
    return data.book;
  },

  /** 
   * Adds a new book to the catalog.
   * POST /api/admin/books — Add a new book 
   * 
   * @param payload - The data for the new book (AddBookPayload)
   * @returns A promise that resolves to an object containing the newly created book_id
   */
  create: async (payload: AddBookPayload): Promise<{ book_id: number }> => {
    // Send book creation payload to the server
    const { data } = await client.post<{ status: string; message: string; book_id: number }>(
      '/admin/books',
      payload
    );
    // Return the newly generated book ID
    return { book_id: data.book_id };
  },

  /** 
   * Updates an existing book's information.
   * PUT /api/admin/books/{id} — Update an existing book 
   * 
   * @param bookId - The unique identifier of the book to update
   * @param payload - The updated book data (UpdateBookPayload)
   * @returns A promise that resolves when the update completes
   */
  update: async (bookId: number, payload: UpdateBookPayload): Promise<void> => {
    // Send update request with the modified book payload
    await client.put(`/admin/books/${bookId}`, payload);
  },

  /** 
   * Removes a book from the catalog.
   * DELETE /api/admin/books/{id} — Delete a book 
   * 
   * @param bookId - The unique identifier of the book to delete
   * @returns A promise that resolves when the deletion completes
   */
  delete: async (bookId: number): Promise<void> => {
    // Send delete request for the specific book ID
    await client.delete(`/admin/books/${bookId}`);
  },

  /** 
   * Searches for books matching a query string and optional category.
   * GET /api/books/search?q=... — Search books by title/author/ISBN 
   * 
   * @param query - The search query string
   * @param categoryId - Optional category ID to filter the search
   * @returns A promise that resolves to an array of matching Book objects
   */
  search: async (query: string, categoryId?: number): Promise<Book[]> => {
    // Prepare query parameters with the search string
    const params: Record<string, string | number> = { q: query };
    // Optionally append category ID to params if provided
    if (categoryId) params.category_id = categoryId;
    
    // Execute search request with the constructed parameters
    const { data } = await client.get<{ status: string; books: Book[] }>('/books/search', { params });
    // Extract and return the array of matched books
    return data.books;
  },
};
