/* ══════════════════════════════════════════════════════════════════════════
   API Response & Common Types
   ══════════════════════════════════════════════════════════════════════════ */

/** Standard wrapper returned by every backend endpoint. */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  [key: string]: T | string | undefined;
}

/** Login response from POST /api/admin/login */
export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  user: AdminUser;
}

/** The admin user profile embedded in the login response. */
export interface AdminUser {
  user_id: number;
  student_id: string;   // maps to admin username
  full_name: string;
  email: string;
  role: 'librarian';
}
