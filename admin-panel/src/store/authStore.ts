/* ══════════════════════════════════════════════════════════════════════════
   Auth Store — Zustand store with localStorage persistence
   Manages JWT token, admin user profile, and login/logout flows.
   ══════════════════════════════════════════════════════════════════════════ */

import { create } from 'zustand';
import type { AdminUser } from '../types/api.types';
import { authApi } from '../api/auth.api';

/**
 * Interface representing the state and actions for authentication.
 */
interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

/**
 * Zustand store for managing authentication state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state values
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Authenticates the admin user and stores the token and user data.
   * @param username - The admin username.
   * @param password - The admin password.
   */
  login: async (username: string, password: string) => {
    // Set loading state and clear any previous errors
    set({ isLoading: true, error: null });
    try {
      // Call the login API
      const data = await authApi.login(username, password);
      // Persist the token and user data in localStorage
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      // Update the store state with the authenticated user data
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      // Extract the error message or use a default one
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Login failed. Please check your credentials.';
      // Update the store state with the error message
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Logs out the admin user and clears the persisted data.
   */
  logout: () => {
    // Remove the token and user data from localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Reset the store state to initial values
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /** 
   * Rehydrates auth state from localStorage on app load. 
   */
  hydrate: () => {
    // Retrieve the token and user data from localStorage
    const token = localStorage.getItem('admin_token');
    const userJson = localStorage.getItem('admin_user');
    if (token && userJson) {
      try {
        // Parse the user data and update the store state if valid
        const user = JSON.parse(userJson) as AdminUser;
        set({ token, user, isAuthenticated: true });
      } catch {
        // Clear localStorage if the user data is invalid
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  },
}));
