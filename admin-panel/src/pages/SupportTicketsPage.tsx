/* ══════════════════════════════════════════════════════════════════════════
   Support Tickets Page — Read-only view of all support tickets
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, LifeBuoy, Eye, Info } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';
import { ticketsApi, type AdminTicket } from '../api/tickets.api';

/**
 * SupportTicketsPage Component
 * 
 * Admin interface for managing and reviewing user support requests.
 * Features a table of tickets, status updates, and a detailed view modal.
 */
export default function SupportTicketsPage() {
  // State for tickets list and UI controls
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // State for the currently selected ticket to view details
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);

  // Fetches support tickets from the API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketsApi.getAll();
      setTickets(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Updates the status of a specific support ticket and refreshes the local state
  const handleUpdateStatus = async (ticketId: number, status: string) => {
    try {
      await ticketsApi.updateStatus(ticketId, status);
      toast.success('Ticket status updated');
      fetchTickets();
      if (selectedTicket?.ticket_id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Memoized ticket list filtered by search text across multiple fields and status
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const selectClass =
    'px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer';

  if (loading) return <LoadingSpinner fullPage label="Loading tickets…" />;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage user support requests</p>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:min-w-[260px] sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, message, or student…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {['ID', 'Student', 'Subject', 'Status', 'Created', 'Updated', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.ticket_id}
                  className="hover:bg-slate-50 border-b border-slate-100 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                    #{ticket.ticket_id}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{ticket.full_name}</span>
                      <span className="text-xs text-slate-400">{ticket.student_id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <LifeBuoy size={14} className="text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-900 truncate max-w-[250px]">
                        {ticket.subject}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={ticket.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {formatDate(ticket.updated_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No tickets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </p>
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Details"
        size="md"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{selectedTicket.subject}</h3>
              <Badge status={selectedTicket.status} />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-700">Update Status:</span>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleUpdateStatus(selectedTicket.ticket_id, e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {selectedTicket.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Ticket ID</p>
                <p className="text-slate-900 font-mono">#{selectedTicket.ticket_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Student</p>
                <p className="text-slate-900">{selectedTicket.full_name} ({selectedTicket.student_id})</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Created</p>
                <p className="text-slate-900">{formatDate(selectedTicket.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Last Updated</p>
                <p className="text-slate-900">{formatDate(selectedTicket.updated_at)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
