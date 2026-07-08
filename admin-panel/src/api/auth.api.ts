/* ══════════════════════════════════════════════════════════════════════════
   Auth API — Admin login
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { LoginResponse } from '../types/api.types';

/**
 * Authentication API methods
 * Provides authentication services for the admin panel.
 */
export const authApi = {
  /** 
   * Authenticates an admin user using username and password.
   * POST /api/admin/login 
   * 
   * @param username - The admin's username
   * @param password - The admin's password
   * @returns A promise that resolves to the login response containing token and user info
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    // Send login request with credentials payload
    const { data } = await client.post<LoginResponse>('/admin/login', {
      username,
      password,
    });
    // Return extracted data on successful authentication
    return data;
  },
};
