import client from './client';

export interface AdminTicket {
  ticket_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  full_name: string;
}

export const ticketsApi = {
  getAll: async (): Promise<AdminTicket[]> => {
    const { data } = await client.get<{ status: string; tickets: AdminTicket[] }>('/admin/tickets');
    return data.tickets;
  },

  updateStatus: async (ticketId: number, status: string): Promise<void> => {
    await client.put(`/admin/tickets/${ticketId}`, { status });
  },
};
