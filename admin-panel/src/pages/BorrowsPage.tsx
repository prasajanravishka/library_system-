/* ══════════════════════════════════════════════════════════════════════════
   Borrows Page — Read-only view of all borrow records
   Data is derived from the admin/books + borrow history APIs.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, ArrowRightLeft, Info, AlertCircle } from 'lucide-react';
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
  const [returnModal, setReturnModal] = useState<{ isOpen: boolean; record: AdminBorrowRecord | null }>({ isOpen: false, record: null });

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

  // Handler to evaluate whether to show the smart return modal or proceed normally
  const handleReturnClick = (record: AdminBorrowRecord) => {
    if (record.fine_amount > 0 && !record.fine_paid) {
      setReturnModal({ isOpen: true, record });
    } else {
      executeReturn(record.borrow_id, false);
    }
  };

  // The actual return execution function
  const executeReturn = async (borrowId: number, payFine: boolean) => {
    if (!payFine && !window.confirm('Mark this book as returned?')) return;
    try {
      await borrowsApi.returnBook(borrowId);
      if (payFine) {
        await borrowsApi.payFine(borrowId);
      }
      toast.success(payFine ? 'Book returned and fine marked as paid' : 'Book returned successfully');
      setReturnModal({ isOpen: false, record: null });
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
              <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200">
                <tr>
                  {['Book', 'Student', 'Borrow Date', 'Due Date', 'Return Date', 'Fine', 'Status', 'Actions'].map(
                    (col) => {
                      let widthClass = 'text-left w-auto';
                      if (col === 'Book') widthClass = 'text-left w-[20%]';
                      else if (col === 'Student') widthClass = 'text-left w-[15%]';
                      else if (col === 'Borrow Date') widthClass = 'text-left w-[10%]';
                      else if (col === 'Due Date') widthClass = 'text-left w-[10%]';
                      else if (col === 'Return Date') widthClass = 'text-left w-[10%]';
                      else if (col === 'Fine') widthClass = 'text-left w-[10%]';
                      else if (col === 'Status') widthClass = 'text-left w-[10%]';
                      else if (col === 'Actions') widthClass = 'text-right w-[15%]';
                      
                      return (
                        <th
                          key={col}
                          className={`py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest ${widthClass}`}
                        >
                          {col}
                        </th>
                      );
                    }
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.borrow_id}
                    className="hover:bg-indigo-50/30 border-b border-slate-100 transition-all duration-300 group"
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
                      <div className="flex flex-col gap-1">
                        <span className={`font-medium ${record.fine_paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${record.fine_amount.toFixed(2)}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${record.fine_paid ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {record.fine_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={record.status} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(record.status === 'borrowed' || record.status === 'overdue') && (
                        <button
                          onClick={() => handleReturnClick(record)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200 shadow-sm"
                        >
                          Return
                        </button>
                      )}
                      {record.fine_amount > 0 && !record.fine_paid && (
                        <button
                          onClick={async () => {
                            if (!window.confirm('Mark this fine as paid?')) return;
                            try {
                              await borrowsApi.payFine(record.borrow_id);
                              toast.success('Fine marked as paid');
                              fetchData();
                            } catch (err) {
                              toast.error(getErrorMessage(err));
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all duration-200 shadow-sm"
                        >
                          Pay Fine
                        </button>
                      )}
                    </div>
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
      
      {/* Smart Return Modal for Overdue Books */}
      {returnModal.isOpen && returnModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Overdue Book Return</h3>
                  <p className="text-sm text-slate-500">Unpaid Fine Detected</p>
                </div>
              </div>
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-600 mb-2">
                  <strong className="text-slate-900 font-semibold">{returnModal.record.full_name}</strong> is returning <strong className="text-slate-900 font-semibold">"{returnModal.record.title}"</strong>.
                </p>
                <p className="text-sm text-slate-600">
                  This book has accrued a fine of <span className="text-rose-600 font-bold text-base">${returnModal.record.fine_amount.toFixed(2)}</span>. Has the student paid this fine at the desk?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => executeReturn(returnModal.record!.borrow_id, true)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm shadow-indigo-200"
                >
                  Return & Mark Paid
                </button>
                <button
                  onClick={() => executeReturn(returnModal.record!.borrow_id, false)}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex justify-center items-center"
                >
                  Return Only (Leave Unpaid)
                </button>
                <button
                  onClick={() => setReturnModal({ isOpen: false, record: null })}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
