/* ══════════════════════════════════════════════════════════════════════════
   Category Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

export interface Category {
  id: number;
  name: string;
  icon: string;
  book_count: number;
  description?: string | null;
}

export interface SupportTicket {
  ticket_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}
