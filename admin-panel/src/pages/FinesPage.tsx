import React, { useState, useEffect } from 'react';
import { Banknote, Search, CheckCircle2, AlertCircle, Settings, X, Copy, Eye } from 'lucide-react';
import { AdminBorrowRecord, borrowsApi } from '../api/borrows.api';
import { settingsApi, LibrarySettings } from '../api/settings.api';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

type FilterType = 'ALL' | 'UNPAID' | 'PAID';

export function FinesPage() {
  const navigate = useNavigate();
  const [fines, setFines] = useState<AdminBorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('UNPAID');

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<LibrarySettings>({ fine_per_day: '0.50', exempt_days: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const finesRecords = await borrowsApi.getFines();
      setFines(finesRecords);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (err) {
      toast.error('Failed to load settings');
    }
  };

  useEffect(() => {
    fetchFines();
    fetchSettings();
  }, []);

  const handlePayFine = async (borrowId: number) => {
    try {
      await borrowsApi.payFine(borrowId);
      toast.success('Fine marked as paid');
      fetchFines();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await settingsApi.updateSettings(settings);
      toast.success('Fine rules updated successfully');
      setShowSettings(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter and search logic
  const filteredFines = fines.filter(record => {
    // 1. Filter by Paid/Unpaid
    if (filter === 'PAID' && !record.fine_paid) return false;
    if (filter === 'UNPAID' && record.fine_paid) return false;

    // 2. Search by Student ID or Name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!record.student_id.toLowerCase().includes(q) && !record.full_name.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  const totalUnpaid = fines.filter(f => !f.fine_paid).reduce((acc, curr) => acc + (curr.fine_amount || 0), 0);
  const totalPaid = fines.filter(f => f.fine_paid).reduce((acc, curr) => acc + (curr.fine_amount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative z-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-none px-8 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 shrink-0 border border-rose-100">
              <Banknote size={20} className="text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Fines Management</h1>
              <p className="text-slate-500 text-sm mt-1">
                Track and manage overdue fines
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Total Unpaid</span>
              <span className="text-lg font-bold text-rose-600">${totalUnpaid.toFixed(2)}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Total Collected</span>
              <span className="text-lg font-bold text-emerald-600">${totalPaid.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => setShowSettings(true)}
              className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium shadow-sm"
            >
              <Settings size={18} />
              Fine Rules
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          
          {/* Controls Bar */}
          <div className="flex-none p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['ALL', 'UNPAID', 'PAID'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filter === f 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {f === 'ALL' ? 'All Fines' : f === 'UNPAID' ? 'Unpaid' : 'Paid'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search student ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : filteredFines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Banknote size={48} className="text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No Fines Found</p>
                <p className="text-sm mt-1">There are no fines matching your criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[25%]">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[25%]">Book</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[15%]">Dates</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[10%]">Fine Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[10%]">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFines.map((record) => (
                    <tr key={record.borrow_id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900 mb-1">{record.full_name}</p>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(record.student_id);
                            toast.success('Student ID copied to clipboard');
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50/60 border border-indigo-100/60 text-indigo-700 font-mono text-xs font-semibold cursor-pointer hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-200 group/id"
                          title="Click to copy ID"
                        >
                          {record.student_id}
                          <Copy size={12} className="opacity-0 group-hover/id:opacity-100 text-indigo-500 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{record.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 whitespace-nowrap">
                          <span className="font-medium text-slate-700">Due:</span> {new Date(record.due_date).toLocaleDateString()}
                        </p>
                        {record.return_date && (
                          <p className="text-xs text-slate-500 whitespace-nowrap mt-1">
                            <span className="font-medium text-slate-700">Ret:</span> {new Date(record.return_date).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">${record.fine_amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {record.fine_paid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                            <AlertCircle size={12} />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/users/${record.user_id}`)}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 shadow-sm"
                            title="View user details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {!record.fine_paid && (
                            <button
                              onClick={() => handlePayFine(record.borrow_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-1 shadow-sm"
                            >
                              <Banknote size={14} />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Settings Modal ──────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-slate-400" />
                Fine Rules Configuration
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Daily Fine Amount ($)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.fine_per_day}
                  onChange={(e) => setSettings({ ...settings, fine_per_day: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
                <p className="text-xs text-slate-500 mt-2">
                  The amount charged per day when a book is overdue.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Exempt Days
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select the days of the week when overdue fines should NOT be calculated.
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { id: 0, label: 'M', full: 'Monday' },
                    { id: 1, label: 'T', full: 'Tuesday' },
                    { id: 2, label: 'W', full: 'Wednesday' },
                    { id: 3, label: 'T', full: 'Thursday' },
                    { id: 4, label: 'F', full: 'Friday' },
                    { id: 5, label: 'S', full: 'Saturday' },
                    { id: 6, label: 'S', full: 'Sunday' },
                  ].map(day => {
                    const currentExempt = settings.exempt_days ? settings.exempt_days.split(',') : [];
                    const isExempt = currentExempt.includes(day.id.toString());
                    return (
                      <button
                        key={day.id}
                        title={`Exempt ${day.full}`}
                        onClick={() => {
                          let newExempt = [...currentExempt];
                          if (isExempt) {
                            newExempt = newExempt.filter(d => d !== day.id.toString());
                          } else {
                            newExempt.push(day.id.toString());
                          }
                          setSettings({ ...settings, exempt_days: newExempt.join(',') });
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          isExempt 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                disabled={savingSettings}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
