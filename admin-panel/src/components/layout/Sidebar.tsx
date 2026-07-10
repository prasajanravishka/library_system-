/* ══════════════════════════════════════════════════════════════════════════
   Sidebar — Glassmorphism navigation sidebar with collapsible state
   ══════════════════════════════════════════════════════════════════════════ */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowRightLeft,
  Tags,
  LifeBuoy,
  Library,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Settings,
  Banknote,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowRightLeft,
  Tags,
  LifeBuoy,
  MapPin,
  Settings,
  Banknote,
};

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Books', path: '/books', icon: 'BookOpen' },
  { label: 'Users', path: '/users', icon: 'Users' },
  { label: 'Circulation', path: '/circulation', icon: 'ArrowRightLeft' },
  { label: 'Borrows', path: '/borrows', icon: 'BookOpen' },
  { label: 'Fines', path: '/fines', icon: 'Banknote' },
  { label: 'Categories', path: '/categories', icon: 'Tags' },
  { label: 'Locations', path: '/locations', icon: 'MapPin' },
  { label: 'Support', path: '/support', icon: 'LifeBuoy' },
  { label: 'Profile', path: '/profile', icon: 'Settings' },
];

/**
 * Sidebar component renders the side navigation menu.
 * It includes the application logo, navigation links, and a toggle button to collapse/expand the sidebar.
 * It adapts its layout for mobile and desktop views based on the UI store states.
 * 
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function Sidebar() {
  // Get the collapsed state of the sidebar from the UI store
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  // Get the function to toggle sidebar collapsed state
  const toggle = useUiStore((s) => s.toggleSidebar);
  // Get the mobile menu open state from the UI store
  const mobileMenuOpen = useUiStore((s) => s.mobileMenuOpen);
  // Get the function to set mobile menu open state
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out',
        /* On mobile: off-screen by default, slide in if mobileMenuOpen. Width is always full or standard sidebar width. */
        !mobileMenuOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
        /* On desktop: apply collapsed state width */
        collapsed ? 'md:w-[72px] w-64' : 'w-64'
      )}
    >
      {/* ── Logo Area ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-slate-200">
        {/* App Logo icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 shrink-0">
          <Library size={20} className="text-white" />
        </div>
        {/* App Title - hidden when sidebar is collapsed */}
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Smart Library
            </h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation Links ────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Iterate over navItems to render navigation links */}
        {navItems.map((item) => {
          // Resolve icon component dynamically from iconMap
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              // Close mobile menu upon navigation link click
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-[0.98]',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent rounded-sm'
                )
              }
            >
              <Icon
                size={20}
                className={cn(
                  'transition-colors',
                  // Highlight icon if the current path matches the link path
                  window.location.pathname === item.path
                    ? 'text-indigo-600'
                    : 'text-slate-500 group-hover:text-indigo-600'
                )}
              />
              {/* Link label - hidden when sidebar is collapsed */}
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ─────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 p-3">
        {/* Button to toggle sidebar collapse state */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 active:scale-[0.97]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
