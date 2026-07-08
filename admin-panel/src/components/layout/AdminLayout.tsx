/* ══════════════════════════════════════════════════════════════════════════
   Admin Layout — Shell wrapper with sidebar + header + scrollable content
   Protects routes by redirecting unauthenticated users to /login.
   ══════════════════════════════════════════════════════════════════════════ */

import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

/**
 * AdminLayout component acts as the main wrapper for all authenticated admin routes.
 * It renders the sidebar, header, and the main scrollable content area.
 * It also protects routes by redirecting unauthenticated users to the login page.
 * 
 * @returns {JSX.Element} The rendered admin layout component.
 */
export default function AdminLayout() {
  // Check if the user is authenticated from the auth store
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Get the collapsed state of the sidebar from the UI store
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  // Get the mobile menu open state from the UI store
  const mobileMenuOpen = useUiStore((s) => s.mobileMenuOpen);
  // Get the function to toggle mobile menu open state from the UI store
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);

  // If the user is not authenticated, redirect them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex relative text-slate-900">
      {/* Mobile overlay backdrop - displayed when the mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Render the Sidebar component */}
      <Sidebar />
      
      {/* Main content wrapper with dynamic left padding based on sidebar collapsed state */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen flex flex-col flex-1 w-full',
          collapsed ? 'md:pl-[72px]' : 'md:pl-64'
        )}
      >
        {/* Render the Header component */}
        <Header />
        
        {/* Main content area where child routes will be rendered via Outlet */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
