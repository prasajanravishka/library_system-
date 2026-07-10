/* ══════════════════════════════════════════════════════════════════════════
   Users API — User management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { User } from '../types/user.types';

/**
 * Users API methods
 * Handles user administration tasks including retrieval, creation, updates, and status toggling.
 */
export const usersApi = {
  /** 
   * Retrieves a complete list of all users in the system.
   * GET /api/admin/users — List all users (admin-only) 
   * 
   * @returns A promise resolving to an array of User objects
   */
  getAll: async (): Promise<User[]> => {
    // Fetch users list from the admin endpoint
    const { data } = await client.get<{ status: string; users: User[] }>('/admin/users');
    // Extract and return the array of users
    return data.users;
  },

  /** 
   * Retrieves a single user's comprehensive details including borrowing history and stats.
   * GET /api/admin/users/{id}
   * 
   * @param userId - The unique identifier of the user
   * @returns A promise resolving to the user details payload
   */
  getUserDetails: async (userId: number): Promise<any> => {
    const { data } = await client.get<any>(`/admin/users/${userId}`);
    return data;
  },

  /** 
   * Toggles a user's status between active and suspended.
   * PUT /api/admin/users/{id}/toggle — Toggle active/suspended 
   * 
   * @param userId - The unique identifier of the user
   * @returns A promise resolving to an object containing the new status
   */
  toggleStatus: async (userId: number): Promise<{ new_status: string }> => {
    // Send put request to toggle the user status flag
    const { data } = await client.put<{ status: string; message: string; new_status: string }>(
      `/admin/users/${userId}/toggle`
    );
    // Return the newly applied status string
    return { new_status: data.new_status };
  },

  /** 
   * Creates a new user in the system.
   * POST /api/admin/users — Create a new user 
   * 
   * @param userData - The details of the new user, optionally including a password
   * @returns A promise resolving to the newly created User object
   */
  create: async (userData: Partial<User> & { password?: string }): Promise<User & { plain_password?: string }> => {
    // Send post request with the new user's payload
    const { data } = await client.post<any>('/admin/users', userData);
    // Map the flat response to a user object
    return {
      user_id: data.user_id,
      student_id: data.student_id,
      full_name: data.full_name,
      email: data.email,
      account_status: 'active',
      created_at: new Date().toISOString(),
      plain_password: data.plain_password
    };
  },

  /** 
   * Updates an existing user's information.
   * PUT /api/admin/users/{id} — Update an existing user 
   * 
   * @param userId - The unique identifier of the user to update
   * @param userData - The modified user fields
   * @returns A promise resolving to the updated User object
   */
  update: async (userId: number, userData: Partial<User>): Promise<User> => {
    // Send put request to apply updates to the user's record
    const { data } = await client.put<{ status: string; user: User }>(`/admin/users/${userId}`, userData);
    // Return the updated user object
    return data.user;
  },

  /** 
   * Deletes a user from the system permanently.
   * DELETE /api/admin/users/{id} — Delete a user 
   * 
   * @param userId - The unique identifier of the user to delete
   * @returns A promise that resolves when the deletion is successful
   */
  delete: async (userId: number): Promise<void> => {
    // Send delete request for the specific user ID
    await client.delete(`/admin/users/${userId}`);
  },
};
