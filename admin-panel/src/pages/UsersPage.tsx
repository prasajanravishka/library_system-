/* ══════════════════════════════════════════════════════════════════════════
   Users Page — User management with CRUD operations
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, Shield, ShieldOff, Users, Plus, Edit2, Trash2 } from 'lucide-react';
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

  // State for user creation/editing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
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
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-slate-200">
                  {['Student ID', 'Full Name', 'Email', 'Status', 'Registered', 'Actions'].map(
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-indigo-600">
                      {user.student_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge status={user.account_status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggle(user.user_id)}
                          disabled={togglingId === user.user_id}
                          className={`flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 active:scale-[0.97]`}
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
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
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
    </div>
  );
}
