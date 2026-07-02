/* ══════════════════════════════════════════════════════════════════════════
   Auth API — Admin login
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { LoginResponse } from '../types/api.types';

export const authApi = {
  /** POST /api/admin/login */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await client.post<LoginResponse>('/admin/login', {
      username,
      password,
    });
    return data;
  },
};
