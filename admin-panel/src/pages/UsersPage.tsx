import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, ShieldOff, Users, Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';
import { usersApi } from '../api/users.api';
import type { User } from '../types/user.types';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import UserForm, { type UserFormData } from '../components/forms/UserForm';
import { formatDate, getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';

/**
 * UsersPage Component
 * 
 * Main interface for managing student accounts (users). Supports full CRUD
 * operations, status toggling (active/suspended), search, and filtering.
 */
export default function UsersPage() {
  // State for the list of users and main UI tracking variables
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Tracks which user's status is currently being toggled to disable the button
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  // State for showing the new user's credentials
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<(User & { plain_password?: string }) | null>(null);

  // State for deletion modals
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const [deletionBlocked, setDeletionBlocked] = useState<{unreturned_books: number; unpaid_fines: number} | null>(null);

  // Fetches all users from the backend
  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Memoized array of users filtered by search query and account status
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Toggles a user's account status between active and suspended
  const handleToggle = async (userId: number) => {
    setTogglingId(userId);
    try {
      const result = await usersApi.toggleStatus(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? { ...u, account_status: result.new_status as 'active' | 'suspended' }
            : u
        )
      );
      toast.success(`User status changed to ${result.new_status}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await usersApi.delete(userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      setDeletionSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.error === 'deletion_blocked') {
        setDeletionBlocked({
          unreturned_books: detail.unreturned_books,
          unpaid_fines: detail.unpaid_fines
        });
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updated = await usersApi.update(editingUser.user_id, data);
        setUsers((prev) => prev.map((u) => (u.user_id === editingUser.user_id ? updated : u)));
        toast.success('User updated successfully');
      } else {
        const created = await usersApi.create(data);
        setUsers((prev) => [created, ...prev]);
        setNewlyCreatedUser(created);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass =
    'px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer';

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage student accounts</p>
        </div>
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student accounts · {users.length} registered
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 active:scale-[0.98]"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:min-w-[260px] sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, student ID, or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          {filteredUsers.length === 0 ? (
            <EmptyState 
              icon={Users} 
              title="No users found" 
              description="Adjust your search or filters to find what you're looking for." 
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200">
                <tr>
                  {['Student ID', 'Full Name', 'Status', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        className={`py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest ${col === 'Actions' ? 'text-right w-1/5' : col === 'Full Name' ? 'text-left w-2/5' : 'text-left w-1/5'}`}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-indigo-50/30 border-b border-slate-100 transition-all duration-300 group"
                  >
                    <td className="py-4 px-4">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(user.student_id);
                          toast.success('Student ID copied to clipboard');
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-700 font-mono text-[13px] font-semibold cursor-pointer hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-200 group/id shadow-sm"
                        title="Click to copy ID"
                      >
                        {user.student_id}
                        <Copy size={13} className="opacity-0 group-hover/id:opacity-100 text-indigo-500 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={user.account_status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/users/${user.user_id}`)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 shadow-sm"
                          title="View user details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(user.user_id)}
                          disabled={togglingId === user.user_id}
                          className="p-2 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all duration-200 disabled:opacity-50 shadow-sm active:scale-[0.97]"
                          title={
                            user.account_status === 'active' ? 'Suspend user' : 'Activate user'
                          }
                        >
                          {user.account_status === 'active' ? (
                            <ShieldOff size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 shadow-sm"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200 shadow-sm"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* ── User Form Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <UserForm user={editingUser} onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
      </Modal>

      {/* ── New User Credentials Modal ────────────────────────────────── */}
      <Modal
        isOpen={!!newlyCreatedUser}
        onClose={() => setNewlyCreatedUser(null)}
        title="User Created Successfully 🎉"
        size="md"
      >
        {newlyCreatedUser && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              The user has been added to the system. Please securely copy and share these credentials with the student, as the password cannot be viewed again later.
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Student ID</span>
                <div className="font-mono text-sm text-slate-900 bg-white border border-slate-200 py-2 px-3 rounded-lg">
                  {newlyCreatedUser.student_id}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Full Name</span>
                <div className="font-medium text-sm text-slate-900 bg-white border border-slate-200 py-2 px-3 rounded-lg">
                  {newlyCreatedUser.full_name}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email</span>
                <div className="text-sm text-slate-900 bg-white border border-slate-200 py-2 px-3 rounded-lg">
                  {newlyCreatedUser.email}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Password</span>
                <div className="font-mono text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 py-2 px-3 rounded-lg flex items-center justify-between">
                  <span>{newlyCreatedUser.plain_password}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedUser.plain_password || '');
                      toast.success('Password copied to clipboard!');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setNewlyCreatedUser(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Deletion Success Modal ────────────────────────────────────── */}
      <Modal
        isOpen={deletionSuccess}
        onClose={() => setDeletionSuccess(false)}
        title="User Deleted Successfully"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
            <Shield size={24} className="text-emerald-600" />
            <p className="text-sm font-medium">The user's ID and Email have been freed up for immediate reuse.</p>
          </div>
          <p className="text-sm text-slate-600">
            Their historical borrowing and fine records have been safely archived to maintain library integrity.
          </p>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setDeletionSuccess(false)}
              className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Deletion Blocked Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!deletionBlocked}
        onClose={() => setDeletionBlocked(null)}
        title="Cannot Delete User"
        size="md"
      >
        {deletionBlocked && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
              <ShieldOff size={24} className="text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold mb-1">Active obligations found</p>
                <p className="text-sm">This student cannot be deleted until all library items are returned and fines are settled.</p>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Unreturned Books</span>
                <span className="font-mono text-sm font-bold text-red-600">{deletionBlocked.unreturned_books}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Unpaid Fines</span>
                <span className="font-mono text-sm font-bold text-red-600">LKR {deletionBlocked.unpaid_fines.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setDeletionBlocked(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
