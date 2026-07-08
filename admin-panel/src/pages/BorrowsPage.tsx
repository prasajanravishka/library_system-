/* ══════════════════════════════════════════════════════════════════════════
   Borrows Page — Read-only view of all borrow records
   Data is derived from the admin/books + borrow history APIs.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, ArrowRightLeft, Info } from 'lucide-react';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';
import { borrowsApi, type AdminBorrowRecord } from '../api/borrows.api';

/**
 * BorrowsPage Component
 * 
 * Displays a read-only list of all book borrow records. Includes search,
 * filtering by status, and the ability to mark a borrowed book as returned.
 */
export default function BorrowsPage() {
  // State for storing the list of borrow records
  const [records, setRecords] = useState<AdminBorrowRecord[]>([]);
  // UI states for loading indicator and filters
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetches borrow records from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      const borrows = await borrowsApi.getAll();
      setRecords(borrows);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler for marking a borrowed book as returned
  const handleReturn = async (borrowId: number) => {
    if (!window.confirm('Mark this book as returned?')) return;
    try {
      await borrowsApi.returnBook(borrowId);
      toast.success('Book returned successfully');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Memoized array of records filtered by search query and borrow status
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const selectClass =
    'px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer';

  if (loading) return <LoadingSpinner fullPage label="Loading borrow records…" />;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Borrow Records</h1>
        <p className="text-sm text-slate-500 mt-1">
          View checkout and return activity · {records.length} records
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
            placeholder="Search by book title or author…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          <option value="borrowed">Borrowed</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {['Book', 'Student', 'Borrow Date', 'Due Date', 'Return Date', 'Fine', 'Status', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.borrow_id}
                  className="hover:bg-slate-50 border-b border-slate-100 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 shrink-0 border border-indigo-100">
                        <ArrowRightLeft size={14} className="text-indigo-600" />
                      </div>
                      <span className="font-medium text-slate-900 truncate max-w-[180px]">
                        {record.title || `Book #${record.book_id}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{record.full_name}</span>
                      <span className="text-xs text-slate-400">{record.student_id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {formatDate(record.borrow_date)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {formatDate(record.due_date)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {record.return_date ? formatDate(record.return_date) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {record.fine_amount > 0 ? (
                      <span className="text-red-600 font-medium">
                        ${record.fine_amount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={record.status} />
                  </td>
                  <td className="py-3 px-4">
                    {record.status === 'borrowed' && (
                      <button
                        onClick={() => handleReturn(record.borrow_id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    No borrow records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {filteredRecords.length} of {records.length} records
          </p>
        </div>
      </div>
    </div>
  );
}
