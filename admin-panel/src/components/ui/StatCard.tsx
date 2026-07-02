/* ══════════════════════════════════════════════════════════════════════════
   StatCard — Dashboard metric card with icon and animated gradient border
   ══════════════════════════════════════════════════════════════════════════ */

import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  subtitle?: string;
  onClick?: () => void;
  isCritical?: boolean;
}

const colorMap = {
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    glow: 'shadow-indigo-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  rose: {
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
    glow: 'shadow-rose-500/10',
  },
  sky: {
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    glow: 'shadow-sky-500/10',
  },
};

export default function StatCard({ title, value, icon: Icon, color, subtitle, onClick, isCritical }: Props) {
  const c = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group',
        onClick ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.98]' : 'cursor-default',
        isCritical && 'border-red-300 bg-red-50 shadow-red-500/10',
        !isCritical && c.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110',
            c.iconBg
          )}
        >
          <Icon size={22} className={c.iconColor} />
        </div>
      </div>
    </div>
  );
}
