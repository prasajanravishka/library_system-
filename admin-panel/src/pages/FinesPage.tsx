import React, { useState, useEffect, useMemo } from 'react';
import { Banknote, Search, CheckCircle2, AlertCircle, Settings, X, Copy, Eye, Check, FileText, Trash2, Plus, Calendar } from 'lucide-react';
import { AdminBorrowRecord, borrowsApi, type AdminPaymentSlip } from '../api/borrows.api';
import { settingsApi, LibrarySettings, LibraryVacation } from '../api/settings.api';
import { toast } from 'sonner';
import { getErrorMessage, formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

type FilterType = 'ALL' | 'UNPAID' | 'PAID';
type TabType = 'FINES' | 'VERIFICATIONS';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api').replace('/api', '');

export function FinesPage() {
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('FINES');

  // Fines states
  const [fines, setFines] = useState<AdminBorrowRecord[]>([]);
  const [loadingFines, setLoadingFines] = useState(true);
  const [finesSearchQuery, setFinesSearchQuery] = useState('');
  const [finesFilter, setFinesFilter] = useState<FilterType>('UNPAID');

  // Payments verification states
  const [allPayments, setAllPayments] = useState<AdminPaymentSlip[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentSlip | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<LibrarySettings>({ fine_per_day: '0.50', exempt_days: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Vacation States
  const [vacations, setVacations] = useState<LibraryVacation[]>([]);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationDesc, setVacationDesc] = useState('');

  const fetchVacations = async () => {
    try {
      setLoadingVacations(true);
      const data = await settingsApi.getVacations();
      setVacations(data);
    } catch (err) {
      toast.error('Failed to load vacation dates');
    } finally {
      setLoadingVacations(false);
    }
  };

  const handleAddVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationStart || !vacationEnd) {
      toast.error('Start and end dates are required');
      return;
    }
    try {
      await settingsApi.addVacation({
        start_date: vacationStart,
        end_date: vacationEnd,
        description: vacationDesc
      });
      toast.success('Vacation range added successfully');
      setVacationStart('');
      setVacationEnd('');
      setVacationDesc('');
      fetchVacations();
      fetchFines();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteVacation = async (rangeId: number) => {
    if (!window.confirm('Are you sure you want to delete this vacation date range?')) return;
    try {
      await settingsApi.deleteVacation(rangeId);
      toast.success('Vacation range deleted successfully');
      fetchVacations();
      fetchFines();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const fetchFines = async () => {
    try {
      setLoadingFines(true);
      const finesRecords = await borrowsApi.getFines();
      setFines(finesRecords);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingFines(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoadingPayments(true);
      const data = await borrowsApi.getAllPayments();
      setAllPayments(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingPayments(false);
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

  const refreshAll = () => {
    fetchFines();
    fetchPendingPayments();
    fetchSettings();
    fetchVacations();
  };

  useEffect(() => {
    refreshAll();
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

  const handleActionPayment = async (paymentId: number, action: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      await borrowsApi.actionPayment(paymentId, action);
      toast.success(`Payment slip ${action} successfully`);
      setSelectedPayment(null);
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
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

  // Filter and search logic for fines
  const filteredFines = useMemo(() => {
    return fines.filter(record => {
      if (finesFilter === 'PAID' && !record.fine_paid) return false;
      if (finesFilter === 'UNPAID' && record.fine_paid) return false;

      if (finesSearchQuery) {
        const q = finesSearchQuery.toLowerCase();
        if (!record.student_id.toLowerCase().includes(q) && !record.full_name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [fines, finesFilter, finesSearchQuery]);

  // Filter and search logic for payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      if (paymentFilter === 'PENDING' && p.status !== 'pending') return false;
      if (paymentFilter === 'APPROVED' && p.status !== 'approved') return false;
      if (paymentFilter === 'REJECTED' && p.status !== 'rejected') return false;

      const query = paymentsSearchQuery.toLowerCase();
      return (
        !paymentsSearchQuery ||
        p.student_name.toLowerCase().includes(query) ||
        p.student_id.toLowerCase().includes(query) ||
        p.book_title.toLowerCase().includes(query) ||
        p.transaction_reference.toLowerCase().includes(query)
      );
    });
  }, [allPayments, paymentFilter, paymentsSearchQuery]);

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
              <h1 className="text-2xl font-bold text-slate-900">Fines & Payments</h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage overdue fines and verify student bank slips
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Total Unpaid</span>
              <span className="text-lg font-bold text-rose-600">LKR {totalUnpaid.toFixed(2)}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Total Collected</span>
              <span className="text-lg font-bold text-emerald-600">LKR {totalPaid.toFixed(2)}</span>
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

        {/* Tab Switcher */}
        <div className="flex gap-6 mt-6 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('FINES')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all relative ${
              activeTab === 'FINES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Overdue Fines
          </button>
          <button
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'VERIFICATIONS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Receipt Verifications
            {allPayments.filter(p => p.status === 'pending').length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                {allPayments.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          
          {/* TAB 1: FINES TRACKING */}
          {activeTab === 'FINES' && (
            <>
              {/* Controls Bar */}
              <div className="flex-none p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {(['ALL', 'UNPAID', 'PAID'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFinesFilter(f)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        finesFilter === f 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      {f === 'ALL' ? 'All Fines' : f === 'UNPAID' ? 'Unpaid' : 'Paid'}
                    </button>
                  ))}
                </div>

                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search student ID or name..."
                    value={finesSearchQuery}
                    onChange={(e) => setFinesSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {loadingFines ? (
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
                            <span className="text-sm font-bold text-slate-900">LKR {record.fine_amount.toFixed(2)}</span>
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
            </>
          )}

          {/* TAB 2: BANK SLIP VERIFICATION */}
          {activeTab === 'VERIFICATIONS' && (
            <>
              {/* Controls Bar */}
              <div className="flex-none p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {([
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'APPROVED', label: 'Complete' },
                    { id: 'REJECTED', label: 'Reject' },
                    { id: 'ALL', label: 'All' },
                  ] as { id: typeof paymentFilter; label: string }[]).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setPaymentFilter(f.id)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        paymentFilter === f.id 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search ID, name, or txn ref..."
                    value={paymentsSearchQuery}
                    onChange={(e) => setPaymentsSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {loadingPayments ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 h-full">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                      <Banknote size={24} className="text-slate-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">No payment slips found</p>
                    <p className="text-sm text-slate-500 mt-1">There are no payment receipts matching your filter criteria.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                      <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Book & Fine</th>
                        <th className="px-6 py-4">Transaction Ref</th>
                        <th className="px-6 py-4">Uploaded At</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayments.map((p) => (
                        <tr key={p.payment_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{p.student_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{p.student_id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-slate-900 line-clamp-1">{p.book_title}</p>
                            <p className="text-xs text-rose-500 font-bold mt-0.5">LKR {p.amount_paid.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-600">
                            {p.transaction_reference}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatDate(p.paid_at)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={p.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                                  p.status === 'pending'
                                    ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/60 text-indigo-700'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Eye size={14} />
                                {p.status === 'pending' ? 'Review Slip' : 'View Details'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Settings Modal ──────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100">
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
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: General Rules */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Daily Fine Amount (LKR)
                  </label>
                  <input 
                    type="number"
                    step="1"
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
                          type="button"
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

              {/* Right Column: Vacation Date Exclusions */}
              <div className="flex flex-col pl-6 border-l border-slate-200 h-[380px] overflow-hidden">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-indigo-500" />
                  Vacation Date Exclusions
                </h3>

                {/* Exclusions List */}
                <div className="flex-1 overflow-y-auto mb-4 border border-slate-100 rounded-xl bg-slate-50 p-3 min-h-[140px] space-y-2.5 custom-scrollbar">
                  {loadingVacations ? (
                    <div className="flex justify-center items-center h-full py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : vacations.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-400 py-6 text-center">
                      <span className="text-xs">No vacation date ranges configured.</span>
                    </div>
                  ) : (
                    vacations.map((vac) => (
                      <div key={vac.range_id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm text-xs group">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate">
                            {vac.description || 'Vacation Period'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(vac.start_date).toLocaleDateString()} – {new Date(vac.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteVacation(vac.range_id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          title="Delete range"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Form to Add Vacation */}
                <div className="space-y-2 border-t border-slate-100 pt-3 flex-none">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Start Date</label>
                      <input
                        type="date"
                        value={vacationStart}
                        onChange={(e) => setVacationStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">End Date</label>
                      <input
                        type="date"
                        value={vacationEnd}
                        onChange={(e) => setVacationEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description (e.g. Summer Vacation)"
                      value={vacationDesc}
                      onChange={(e) => setVacationDesc(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs truncate"
                    />
                    <button
                      type="button"
                      onClick={handleAddVacation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      title="Add vacation exclusion"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                disabled={savingSettings}
              >
                Close Settings
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

      {/* ── Detail Review Modal ────────────────────────────────────────── */}
      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title="Review Payment Receipt"
          size="md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="block text-slate-400 font-medium uppercase tracking-wider">Student</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {selectedPayment.student_name} ({selectedPayment.student_id})
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium uppercase tracking-wider">Fine Amount</span>
                <span className="font-bold text-rose-600 mt-1 block text-sm">
                  LKR {selectedPayment.amount_paid.toFixed(2)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-400 font-medium uppercase tracking-wider">Book Title</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {selectedPayment.book_title}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium uppercase tracking-wider">Transaction Reference</span>
                <span className="font-mono font-semibold text-indigo-600 mt-1 block">
                  {selectedPayment.transaction_reference}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium uppercase tracking-wider">Uploaded Date</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {formatDate(selectedPayment.paid_at)}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-2">Uploaded Slip Image</span>
              {selectedPayment.receipt_image_path ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-[300px] flex items-center justify-center">
                  <img
                    src={`${BACKEND_URL}/${selectedPayment.receipt_image_path}`}
                    alt="Uploaded Bank Slip"
                    className="object-contain max-h-[300px] w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Receipt+Not+Found';
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                  <FileText size={32} className="mb-2" />
                  <span className="text-xs">No image slip attached</span>
                </div>
              )}
            </div>

            {selectedPayment.status === 'pending' ? (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  disabled={actionLoading}
                  onClick={() => handleActionPayment(selectedPayment.payment_id, 'rejected')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                  Reject Slip
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleActionPayment(selectedPayment.payment_id, 'approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check size={16} />
                  Approve Payment
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  Verification Status: <Badge status={selectedPayment.status} />
                </span>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
