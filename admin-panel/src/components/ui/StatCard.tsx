/* ══════════════════════════════════════════════════════════════════════════
   StatCard — Dashboard metric card with icon and animated gradient border
   ══════════════════════════════════════════════════════════════════════════ */

import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Props for the StatCard component.
 * @property {string} title - The title of the statistic card.
 * @property {string | number} value - The primary numerical or textual value to display.
 * @property {LucideIcon} icon - The icon component to display on the card.
 * @property {'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'} color - The color theme for the icon and hover glow effects.
 * @property {string} [subtitle] - Optional subtitle text below the value.
 * @property {() => void} [onClick] - Optional click handler, making the card interactive.
 * @property {boolean} [isCritical] - Optional flag indicating a critical state (applies red styling).
 */
interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  subtitle?: string;
  onClick?: () => void;
  isCritical?: boolean;
}

// Predefined styling classes based on the chosen color theme
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

/**
 * StatCard component displays a formatted metric with an icon and optional interactivity.
 * It uses a color map to dynamically apply thematic styles based on the given color prop.
 *
 * @param {Props} props - The component props.
 * @returns {JSX.Element} The rendered statistic card element.
 */
export default function StatCard({ title, value, icon: Icon, color, subtitle, onClick, isCritical }: Props) {
  // Retrieve the designated styling for the card's color theme
  const c = colorMap[color];

  // Render the card wrapper with dynamic styles for interaction, critical state, and glow
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
      {/* Container for content and icon layout */}
      <div className="flex items-start justify-between">
        {/* Text information column */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        {/* Icon container with themed background and animated hover scaling */}
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
