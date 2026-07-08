/* ══════════════════════════════════════════════════════════════════════════
   Categories API — Category management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Category } from '../types/category.types';
import type { Book } from '../types/book.types';

/**
 * Categories API methods
 * Handles category creation, retrieval, updates, and deletion.
 */
export const categoriesApi = {
  /** 
   * Retrieves all categories along with their book counts.
   * GET /api/categories — All categories with book counts 
   * 
   * @returns A promise resolving to an array of Category objects
   */
  getAll: async (): Promise<Category[]> => {
    // Fetch categories from the public endpoint
    const { data } = await client.get<{ status: string; categories: Category[] }>('/categories');
    // Extract and return the array of categories
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
    // Fetch category and books data using the category ID
    const { data } = await client.get<{ status: string; category: Category; books: Book[] }>(
      `/categories/${categoryId}/books`
    );
    // Return extracted category details and books list
    return { category: data.category, books: data.books };
  },

  /** 
   * Creates a new category.
   * POST /api/admin/categories — Create a new category 
   * 
   * @param categoryData - Data for the new category (Partial<Category>)
   * @returns A promise resolving to the newly created Category object
   */
  create: async (categoryData: Partial<Category>): Promise<Category> => {
    // Send post request with new category data to the admin endpoint
    const { data } = await client.post<{ status: string; category: Category }>('/admin/categories', categoryData);
    // Return the created category object
    return data.category;
  },

  /** 
   * Updates an existing category.
   * PUT /api/admin/categories/{id} — Update an existing category 
   * 
   * @param categoryId - The unique identifier of the category to update
   * @param categoryData - The updated fields for the category
   * @returns A promise resolving to the updated Category object
   */
  update: async (categoryId: number, categoryData: Partial<Category>): Promise<Category> => {
    // Send put request with modified category fields
    const { data } = await client.put<{ status: string; category: Category }>(
      `/admin/categories/${categoryId}`,
      categoryData
    );
    // Return the updated category details
    return data.category;
  },

  /** 
   * Deletes a category.
   * DELETE /api/admin/categories/{id} — Delete a category 
   * 
   * @param categoryId - The unique identifier of the category to delete
   * @returns A promise that resolves when the deletion is successful
   */
  delete: async (categoryId: number): Promise<void> => {
    // Send delete request for the specified category ID
    await client.delete(`/admin/categories/${categoryId}`);
  },
};
