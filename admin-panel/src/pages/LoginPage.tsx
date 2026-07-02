/* ══════════════════════════════════════════════════════════════════════════
   Login Page — Glassmorphism centered login card
   ══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Library, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Already logged in — redirect to dashboard
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password.');
      return;
    }

    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* Decorative orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-violet-100 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md" style={{ animation: 'pageIn 400ms ease-out' }}>
        {/* ── Logo ────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30 mb-4">
            <Library size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Library</h1>
          <p className="text-sm text-slate-500 mt-1">Admin Panel — Sign In</p>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Enter admin username"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Default credentials: <span className="text-slate-700 font-mono">librarian</span> /{' '}
              <span className="text-slate-700 font-mono">password123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Smart Library Management System © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
