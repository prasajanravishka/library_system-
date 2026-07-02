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
import client from '../api/client';

interface Ticket {
  ticket_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // The support tickets API requires user context.
        // We'll attempt to fetch them; if it fails, show empty state.
        const { data } = await client.get('/support/tickets');
        setTickets(data.tickets || []);
      } catch {
        // Expected: this endpoint is user-scoped, not admin-scoped
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          The current API provides user-scoped ticket access. An admin-level tickets endpoint would
          enable viewing all users' tickets from this panel.
        </p>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:min-w-[260px] sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or message…"
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
                {['ID', 'Subject', 'Status', 'Created', 'Updated', 'Actions'].map((col) => (
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
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    {tickets.length === 0
                      ? 'No support tickets available. This view requires an admin-level tickets API.'
                      : 'No tickets match your filters.'}
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
                <p className="text-xs text-slate-500 mb-0.5">User ID</p>
                <p className="text-slate-900">{selectedTicket.user_id}</p>
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
