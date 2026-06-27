import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Book, Users, Repeat, CreditCard } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Book, label: 'Books', path: '/books' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Repeat, label: 'Circulation', path: '/circulation' },
  { icon: CreditCard, label: 'Fines', path: '/fines' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-10 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl text-white tracking-tight">
        <span className="text-blue-500 mr-2">Smart</span>Library
      </div>
      
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600/10 text-blue-500" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 text-xs text-center text-slate-400">
          Admin Panel v1.0
        </div>
      </div>
    </aside>
  );
};
