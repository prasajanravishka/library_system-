/* ══════════════════════════════════════════════════════════════════════════
   Category Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Represents a Category entity.
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
  book_count: number;
  description?: string | null;
}

/**
 * Represents a Support Ticket entity.
 */
export interface SupportTicket {
  ticket_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}
