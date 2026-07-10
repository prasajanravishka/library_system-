import React from 'react';
import { useTheme } from '../lib/ThemeProvider';
import { Moon, Sun, User } from 'lucide-react';

/**
 * ProfileSettingsPage Component
 * 
 * Allows the admin user to manage their account preferences and application
 * appearance, such as toggling between light and dark themes.
 */
export default function ProfileSettingsPage() {
  // Consume the theme context to get current theme state and the toggle function
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Profile Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your account preferences and application appearance.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* User Info Section (Mock) */}
        <div className="p-6 border-b border-slate-200 flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Admin User</h2>
            <p className="text-slate-500">admin@library.local</p>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Appearance</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Theme Preference</p>
              <p className="text-sm text-slate-500 mt-1">
                Toggle between dark and light mode for the dashboard.
              </p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={18} />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon size={18} />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
