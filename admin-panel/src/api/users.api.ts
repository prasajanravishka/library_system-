/* ══════════════════════════════════════════════════════════════════════════
   Users API — User management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { User } from '../types/user.types';

export const usersApi = {
  /** GET /api/admin/users — List all users (admin-only) */
  getAll: async (): Promise<User[]> => {
    const { data } = await client.get<{ status: string; users: User[] }>('/admin/users');
    return data.users;
  },

  /** PUT /api/admin/users/{id}/toggle — Toggle active/suspended */
  toggleStatus: async (userId: number): Promise<{ new_status: string }> => {
    const { data } = await client.put<{ status: string; message: string; new_status: string }>(
      `/admin/users/${userId}/toggle`
    );
    return { new_status: data.new_status };
  },

  /** POST /api/admin/users — Create a new user */
  create: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    const { data } = await client.post<{ status: string; user: User }>('/admin/users', userData);
    return data.user;
  },

  /** PUT /api/admin/users/{id} — Update an existing user */
  update: async (userId: number, userData: Partial<User>): Promise<User> => {
    const { data } = await client.put<{ status: string; user: User }>(`/admin/users/${userId}`, userData);
    return data.user;
  },

  /** DELETE /api/admin/users/{id} — Delete a user */
  delete: async (userId: number): Promise<void> => {
    await client.delete(`/admin/users/${userId}`);
  },
};
