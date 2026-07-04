import React from 'react';
import { useTheme } from '../lib/ThemeProvider';
import { Moon, Sun, User } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-(--color-text-primary)">
          Profile Settings
        </h1>
        <p className="text-(--color-text-secondary) mt-1">
          Manage your account preferences and application appearance.
        </p>
      </div>

      <div className="bg-(--color-bg-secondary) border border-(--color-border-color) rounded-xl overflow-hidden shadow-sm">
        {/* User Info Section (Mock) */}
        <div className="p-6 border-b border-(--color-border-color) flex items-center space-x-4">
          <div className="w-16 h-16 bg-(--color-accent-primary) rounded-full flex items-center justify-center text-white text-2xl font-bold">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-(--color-text-primary)">Admin User</h2>
            <p className="text-(--color-text-secondary)">admin@library.local</p>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-(--color-text-primary) mb-4">Appearance</h3>
          
          <div className="flex items-center justify-between p-4 bg-(--color-bg-primary) rounded-lg border border-(--color-border-color)">
            <div>
              <p className="font-medium text-(--color-text-primary)">Theme Preference</p>
              <p className="text-sm text-(--color-text-secondary) mt-1">
                Toggle between dark and light mode for the dashboard.
              </p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-(--color-accent-primary) text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
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
