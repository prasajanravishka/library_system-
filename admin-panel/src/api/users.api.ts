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
};
