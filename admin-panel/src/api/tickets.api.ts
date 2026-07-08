import client from './client';

/**
 * Interface representing a support ticket submitted by a user.
 */
export interface AdminTicket {
  /** The unique identifier of the ticket */
  ticket_id: number;
  /** Internal user ID of the person who submitted the ticket */
  user_id: number;
  /** Subject line of the ticket */
  subject: string;
  /** Detailed message content of the ticket */
  message: string;
  /** Current status of the ticket (e.g., 'open', 'closed') */
  status: string;
  /** Timestamp when the ticket was created */
  created_at: string;
  /** Timestamp of the last update to the ticket */
  updated_at: string;
  /** Student ID of the submitter */
  student_id: string;
  /** Full name of the submitter */
  full_name: string;
}

/**
 * Tickets API methods
 * Handles support and helpdesk tickets submitted by users.
 */
export const ticketsApi = {
  /**
   * Retrieves all support tickets for the admin to review.
   * 
   * @returns A promise resolving to an array of AdminTicket objects
   */
  getAll: async (): Promise<AdminTicket[]> => {
    // Fetch all tickets from the admin endpoint
    const { data } = await client.get<{ status: string; tickets: AdminTicket[] }>('/admin/tickets');
    // Extract and return the tickets array
    return data.tickets;
  },

  /**
   * Updates the status of a specific support ticket.
   * 
   * @param ticketId - The unique identifier of the ticket
   * @param status - The new status to apply (e.g., 'resolved', 'closed')
   * @returns A promise that resolves when the update completes
   */
  updateStatus: async (ticketId: number, status: string): Promise<void> => {
    // Send a PUT request with the updated status payload
    await client.put(`/admin/tickets/${ticketId}`, { status });
  },
};
