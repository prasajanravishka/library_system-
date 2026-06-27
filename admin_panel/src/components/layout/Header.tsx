import { Bell, Search, UserCircle } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      
      {/* Global Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search books, users, or transactions..." 
            className="w-full bg-slate-100 hover:bg-slate-200 focus:bg-white border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full pl-10 pr-4 py-2 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-1"></div>
        
        <button className="flex items-center gap-2 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200">
          <UserCircle className="w-8 h-8 text-slate-400" />
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-sm font-semibold text-slate-700 leading-none">Admin User</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Administrator</span>
          </div>
        </button>
      </div>
    </header>
  );
};
