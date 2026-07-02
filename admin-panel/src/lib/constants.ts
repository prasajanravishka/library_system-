/* ══════════════════════════════════════════════════════════════════════════
   Application Constants
   ══════════════════════════════════════════════════════════════════════════ */

export const APP_NAME = 'Smart Library';
export const APP_SUBTITLE = 'Admin Panel';

/** Navigation items for the sidebar. Icon names correspond to lucide-react. */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Books', path: '/books', icon: 'BookOpen' },
  { label: 'Users', path: '/users', icon: 'Users' },
  { label: 'Borrows', path: '/borrows', icon: 'ArrowRightLeft' },
  { label: 'Categories', path: '/categories', icon: 'Tags' },
  { label: 'Support', path: '/support', icon: 'LifeBuoy' },
] as const;

/** Status badge color map. */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  borrowed: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  overdue: { bg: 'bg-red-500/15', text: 'text-red-400' },
  returned: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  lost: { bg: 'bg-red-500/15', text: 'text-red-400' },
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  suspended: { bg: 'bg-red-500/15', text: 'text-red-400' },
  open: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
  in_progress: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  closed: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
};
