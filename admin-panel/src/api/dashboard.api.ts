/* ══════════════════════════════════════════════════════════════════════════
   Dashboard API — Stats and analytics
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Book } from '../types/book.types';
import type { Category } from '../types/category.types';

/**
 * Interface representing a trending book with borrowing statistics.
 */
export interface TrendingBook {
  /** The unique identifier of the book */
  book_id: number;
  /** The title of the book */
  title: string;
  /** The author of the book */
  author: string;
  /** URL pointing to the book's cover image */
  cover_image_url: string;
  /** The total number of times the book has been borrowed */
  borrow_count: number;
}

/**
 * Interface representing aggregate statistics for the dashboard.
 */
export interface DashboardStats {
  /** Total number of books in the library */
  total_books: number;
  /** Number of currently active borrows */
  active_borrows: number;
  /** Number of overdue borrows */
  overdue: number;
  /** List of top trending books */
  trending_books: TrendingBook[];
}

/**
 * Dashboard API methods
 * Fetches statistics, featured books, and category overviews.
 */
export const dashboardApi = {
  /** 
   * Retrieves global library statistics for the admin dashboard.
   * GET /api/stats — Global library statistics 
   * 
   * @returns A promise resolving to the DashboardStats object
   */
  getStats: async (): Promise<DashboardStats> => {
    // Fetch system-wide stats from the server
    const { data } = await client.get<{ status: string; stats: DashboardStats }>('/stats');
    // Return extracted statistics data
    return data.stats;
  },

  /** 
   * Retrieves a list of recently added or featured books.
   * GET /api/featured_books — Recently added books 
   * 
   * @returns A promise resolving to an array of featured Book objects
   */
  getFeaturedBooks: async (): Promise<Book[]> => {
    // Fetch featured books
    const { data } = await client.get<{ status: string; featured_books: Book[] }>('/featured_books');
    // Return extracted featured books list
    return data.featured_books;
  },

  /** 
   * Retrieves all categories along with their book counts.
   * GET /api/categories — All categories with book counts 
   * 
   * @returns A promise resolving to an array of Category objects
   */
  getCategories: async (): Promise<Category[]> => {
    // Fetch categories summary
    const { data } = await client.get<{ status: string; categories: Category[] }>('/categories');
    // Return extracted categories list
    return data.categories;
  },

  /** 
   * Retrieves a specific category and all books belonging to it.
   * GET /api/categories/{id}/books — Books in a specific category 
   * 
   * @param categoryId - The unique identifier of the category
   * @returns A promise resolving to an object containing the category and its associated books
   */
  getCategoryBooks: async (categoryId: number): Promise<{ category: Category; books: Book[] }> => {
    // Fetch category and related books using category ID
    const { data } = await client.get<{ status: string; category: Category; books: Book[] }>(
      `/categories/${categoryId}/books`
    );
    // Return structured object containing both the category info and its books
    return { category: data.category, books: data.books };
  },
};
