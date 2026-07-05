/* ══════════════════════════════════════════════════════════════════════════
   Dashboard API — Stats and analytics
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Book } from '../types/book.types';
import type { Category } from '../types/category.types';

export interface TrendingBook {
  book_id: number;
  title: string;
  author: string;
  cover_image_url: string;
  borrow_count: number;
}

export interface DashboardStats {
  total_books: number;
  active_borrows: number;
  overdue: number;
  trending_books: TrendingBook[];
}

export const dashboardApi = {
  /** GET /api/stats — Global library statistics */
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await client.get<{ status: string; stats: DashboardStats }>('/stats');
    return data.stats;
  },

  /** GET /api/featured_books — Recently added books */
  getFeaturedBooks: async (): Promise<Book[]> => {
    const { data } = await client.get<{ status: string; featured_books: Book[] }>('/featured_books');
    return data.featured_books;
  },

  /** GET /api/categories — All categories with book counts */
  getCategories: async (): Promise<Category[]> => {
    const { data } = await client.get<{ status: string; categories: Category[] }>('/categories');
    return data.categories;
  },

  /** GET /api/categories/{id}/books — Books in a specific category */
  getCategoryBooks: async (categoryId: number): Promise<{ category: Category; books: Book[] }> => {
    const { data } = await client.get<{ status: string; category: Category; books: Book[] }>(
      `/categories/${categoryId}/books`
    );
    return { category: data.category, books: data.books };
  },
};
