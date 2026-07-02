/* ══════════════════════════════════════════════════════════════════════════
   Dashboard Page — Stats, charts, and recent activity overview
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { BookOpen, Users, ArrowRightLeft, AlertTriangle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Skeleton } from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import { dashboardApi, type DashboardStats } from '../api/dashboard.api';
import { booksApi } from '../api/books.api';
import { usersApi } from '../api/users.api';
import type { Book } from '../types/book.types';
import type { Category } from '../types/category.types';
import { formatDate, getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#06b6d4', '#84cc16'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, booksData, catsData, usersData] = await Promise.all([
          dashboardApi.getStats(),
          booksApi.getAll(),
          dashboardApi.getCategories(),
          usersApi.getAll(),
        ]);
        setStats(statsData);
        setRecentBooks(booksData.slice(0, 8));
        setCategories(catsData);
        setTotalUsers(usersData.length);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Skeleton className="h-10 w-10 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Prepare pie chart data from categories
  const categoryChartData = categories
    .filter((c) => c.book_count > 0)
    .map((c) => ({ name: c.name, value: c.book_count }));

  // Prepare bar chart data from categories (top 7)
  const barChartData = [...categories]
    .sort((a, b) => b.book_count - a.book_count)
    .slice(0, 7)
    .map((c) => ({ name: c.name, books: c.book_count }));

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.full_name}</p>
        </div>
      </div>
      
      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Books"
          value={stats?.total_books ?? 0}
          icon={BookOpen}
          color="indigo"
          subtitle="In catalog"
          onClick={() => navigate('/books')}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="emerald"
          subtitle="Registered students"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Active Borrows"
          value={stats?.active_borrows ?? 0}
          icon={ArrowRightLeft}
          color="sky"
          subtitle="Currently checked out"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Past due date"
          isCritical={(stats?.overdue ?? 0) > 0}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Category Distribution</h2>
          </div>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryChartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '13px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
              No category data available
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {categoryChartData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-xs text-slate-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Books per Category Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Books per Category</h2>
          </div>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '13px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="books" radius={[6, 6, 0, 0]}>
                  {barChartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Books Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Recently Added Books</h2>
          </div>
          <a
            href="/books"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Author
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ISBN
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {recentBooks.map((book) => (
                <tr className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{book.title}</td>
                  <td className="py-3 px-4 text-slate-500">{book.author || '—'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs tabular-nums">{book.isbn || '—'}</td>
                  <td className="py-3 px-4">
                    <Badge status={book.availability_status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs tabular-nums">{formatDate(book.added_at)}</td>
                </tr>
              ))}
              {recentBooks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No books in the catalog yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
