/* ══════════════════════════════════════════════════════════════════════════
   Categories API — Category management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Category } from '../types/category.types';
import type { Book } from '../types/book.types';

export const categoriesApi = {
  /** GET /api/categories — All categories with book counts */
  getAll: async (): Promise<Category[]> => {
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

  /** POST /api/admin/categories — Create a new category */
  create: async (categoryData: Partial<Category>): Promise<Category> => {
    const { data } = await client.post<{ status: string; category: Category }>('/admin/categories', categoryData);
    return data.category;
  },

  /** PUT /api/admin/categories/{id} — Update an existing category */
  update: async (categoryId: number, categoryData: Partial<Category>): Promise<Category> => {
    const { data } = await client.put<{ status: string; category: Category }>(
      `/admin/categories/${categoryId}`,
      categoryData
    );
    return data.category;
  },

  /** DELETE /api/admin/categories/{id} — Delete a category */
  delete: async (categoryId: number): Promise<void> => {
    await client.delete(`/admin/categories/${categoryId}`);
  },
};
