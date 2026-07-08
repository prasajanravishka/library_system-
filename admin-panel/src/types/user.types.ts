/* ══════════════════════════════════════════════════════════════════════════
   User Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Represents a User entity.
 */
export interface User {
  user_id: number;
  student_id: string;
  full_name: string;
  email: string;
  account_status: 'active' | 'suspended';
  created_at: string;
}
