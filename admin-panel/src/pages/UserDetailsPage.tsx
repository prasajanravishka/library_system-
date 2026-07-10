import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  ShieldOff,
  BookOpen,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { usersApi } from '../api/users.api';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUserDetails(Number(id));
      setUserData(data);
    } catch (err) {
      toast.error('Failed to load user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const { new_status } = await usersApi.toggleStatus(Number(id));
      setUserData((prev: any) => ({
        ...prev,
        user: { ...prev.user, account_status: new_status }
      }));
      toast.success(`User status changed to ${new_status}`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userData || !userData.user) {
    return (
      <div className="p-8 text-center text-slate-500">
        User not found.
      </div>
    );
  }

  const { user, borrowing_history, stats } = userData;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
      </div>

      {/* ── Main Profile Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-4xl font-bold shadow-lg">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          
          {/* Info */}
          <div className="flex-grow space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
                <p className="text-slate-500 font-mono text-sm mt-1">ID: {user.student_id}</p>
              </div>
              <Badge status={user.account_status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm">Registered {formatDate(user.created_at)}</span>
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  user.account_status === 'active' 
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {user.account_status === 'active' ? (
                  <><ShieldOff size={16} /> Suspend User</>
                ) : (
                  <><Shield size={16} /> Activate User</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <BookOpen size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Borrowed</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_borrowed}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Overdue Books</p>
            <p className="text-2xl font-bold text-slate-900">{stats.currently_overdue}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <DollarSign size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Unpaid Fines</p>
            <p className="text-2xl font-bold text-slate-900">${stats.unpaid_fines.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── Borrowing History Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Borrowing History</h2>
        </div>
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          {borrowing_history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No borrowing history found for this user.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-slate-500 uppercase tracking-wider text-xs">Book</th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-500 uppercase tracking-wider text-xs">Borrowed</th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-500 uppercase tracking-wider text-xs">Due</th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-right py-3 px-6 font-semibold text-slate-500 uppercase tracking-wider text-xs">Fine</th>
                </tr>
              </thead>
              <tbody>
                {borrowing_history.map((record: any) => (
                  <tr key={record.borrow_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900 line-clamp-1">{record.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{record.author}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(record.borrow_date)}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(record.due_date)}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        record.status === 'borrowed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        record.status === 'returned' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono">
                      {record.fine_amount > 0 ? (
                        <span className={record.fine_paid ? 'text-slate-400 line-through' : 'text-red-600 font-bold'}>
                          ${Number(record.fine_amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
