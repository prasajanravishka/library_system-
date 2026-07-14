/* ══════════════════════════════════════════════════════════════════════════
   App — Root component with React Router configuration
   ══════════════════════════════════════════════════════════════════════════ */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout
import AdminLayout from './components/layout/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';
import UsersPage from './pages/UsersPage';
import UserDetailsPage from './pages/UserDetailsPage';
import BorrowsPage from './pages/BorrowsPage';
import { FinesPage } from './pages/FinesPage';
import CategoriesPage from './pages/CategoriesPage';
import LocationsPage from './pages/LocationsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import CirculationPage from './pages/CirculationPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Root Application Component
 * 
 * Sets up the React Router, global toast notifications, and defines
 * the route hierarchy for the admin panel.
 * 
 * @returns {JSX.Element} The rendered application component.
 */
export default function App() {
  return (
    // Initialize BrowserRouter for standard client-side routing
    <BrowserRouter>
      {/* Global toast notification provider for displaying alerts across the app */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
        richColors
      />

      {/* Define the main routing structure for the application */}
      <Routes>
        {/* Public route - Accessible without authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes - Wrapped by AdminLayout which enforces authentication checks */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route path="/circulation" element={<CirculationPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailsPage />} />
          <Route path="/borrows" element={<BorrowsPage />} />
          <Route path="/fines" element={<FinesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/support" element={<SupportTicketsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
        </Route>

        {/* Catch-all route for handling undefined paths (404 Page Not Found) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
