/* ══════════════════════════════════════════════════════════════════════════
   Badge — Status badge with color variants
   ══════════════════════════════════════════════════════════════════════════ */

import { cn, capitalize } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/constants';

interface Props {
  status: string;
  className?: string;
}

export default function Badge({ status, className }: Props) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-500/15', text: 'text-slate-400' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide',
        colors.bg,
        colors.text,
        className
      )}
    >
      {capitalize(status.replace('_', ' '))}
    </span>
  );
}
