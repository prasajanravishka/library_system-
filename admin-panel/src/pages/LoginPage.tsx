/* ══════════════════════════════════════════════════════════════════════════
   Login Page — Premium Full Split-Screen Design
   ══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex w-full font-sans bg-white">
      
      {/* ── Left Side (Photography & Branding) ───────────────────────── */}
      <div className="hidden lg:flex relative w-1/2 bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {/* Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-900/30"></div>
        
        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 lg:p-20">
          {/* Logo / Top Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg">
               <BookOpen size={22} className="text-[#0d59f2]" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Smart Library</span>
          </div>

          {/* Main Text */}
          <div className="max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-[1.15] tracking-tight drop-shadow-md">
              Fast, Efficient and Productive.
            </h1>
            <p className="text-slate-300 text-[17px] leading-relaxed drop-shadow-sm font-medium">
              Manage your library effortlessly. Everything you need to track books, members, and loans in one beautifully designed workspace.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Side (Login Form) ──────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-white">
        
        {/* Top right language/help (optional, adds premium feel) */}
        <div className="absolute top-10 right-10 hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
           <div className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
              <span className="text-lg leading-none">🇺🇸</span>
              <span>English</span>
           </div>
           <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
        </div>

        <div className="w-full max-w-[400px]">
          
          <div className="mb-10 text-center lg:text-left">
             <h2 className="text-[32px] font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h2>
             <p className="text-slate-500 text-[15px]">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0d59f2] focus:ring-1 focus:ring-[#0d59f2] transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0d59f2] focus:ring-1 focus:ring-[#0d59f2] transition-all placeholder:text-slate-400 shadow-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                 <p className="text-[12px] text-slate-500">Use 8 or more characters</p>
                 <a href="#" className="text-[12px] font-semibold text-[#0d59f2] hover:underline">Forgot password?</a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 mt-6 rounded-xl bg-[#0d59f2] text-white font-semibold text-[15px] tracking-wide hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(13,89,242,0.3)]"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : null}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[14px] text-slate-600">
              Don't have an account?{' '}
              <a href="#" className="text-[#0d59f2] font-semibold hover:underline">
                Contact your administrator
              </a>
            </p>
          </div>
          
        </div>

        {/* Footer for mobile only */}
        <div className="absolute bottom-8 flex sm:hidden items-center gap-6 text-xs font-medium text-slate-500">
           <div className="flex items-center gap-2">
              <span className="text-base leading-none">🇺🇸</span> English
           </div>
           <a href="#">Support</a>
        </div>
      </div>

    </div>
  );
}
