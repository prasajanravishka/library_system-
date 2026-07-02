/* ══════════════════════════════════════════════════════════════════════════
   404 Not Found Page
   ══════════════════════════════════════════════════════════════════════════ */

import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <h1 className="text-[120px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600 leading-none">
          404
        </h1>
        <div className="absolute inset-0 blur-3xl bg-indigo-500/10 rounded-full" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved. Check the URL or navigate back
        to the dashboard.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          <Home size={16} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
