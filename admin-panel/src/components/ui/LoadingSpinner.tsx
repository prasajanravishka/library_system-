/* ══════════════════════════════════════════════════════════════════════════
   LoadingSpinner — Animated spinner with optional label
   ══════════════════════════════════════════════════════════════════════════ */

import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  size?: number;
  className?: string;
  label?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 24, className, label, fullPage }: Props) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 size={size} className="animate-spin text-indigo-400" />
      {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
