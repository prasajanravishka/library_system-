/* ══════════════════════════════════════════════════════════════════════════
   Header — Top bar with page title, search, and admin profile/logout
   ══════════════════════════════════════════════════════════════════════════ */

import { LogOut, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* ── Left: Mobile menu & Breadcrumb area ───────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-[0.97]"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Right: Admin profile & actions ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Notification bell (decorative for now) */}
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 active:scale-[0.97]">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200" />

        {/* Admin profile chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.full_name || 'Admin'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Librarian</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-[0.97]"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
