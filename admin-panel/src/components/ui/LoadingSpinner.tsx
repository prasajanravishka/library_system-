/* ══════════════════════════════════════════════════════════════════════════
   LoadingSpinner — Animated spinner with optional label
   ══════════════════════════════════════════════════════════════════════════ */

import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Props for the LoadingSpinner component.
 * @property {number} [size] - Optional size of the spinner icon (defaults to 24).
 * @property {string} [className] - Optional additional CSS classes for the container.
 * @property {string} [label] - Optional text label to display below the spinner.
 * @property {boolean} [fullPage] - Optional flag to center the spinner in a full page view.
 */
interface Props {
  size?: number;
  className?: string;
  label?: string;
  fullPage?: boolean;
}

/**
 * LoadingSpinner component displays a spinning icon, optionally with a label,
 * and can be centered within the page.
 *
 * @param {Props} props - The component props.
 * @returns {JSX.Element} The rendered loading spinner.
 */
export default function LoadingSpinner({ size = 24, className, label, fullPage }: Props) {
  // Construct the base spinner element with optional label
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 size={size} className="animate-spin text-indigo-400" />
      {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
    </div>
  );

  // If fullPage flag is true, wrap the spinner in a minimum-height container to center it
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  // Otherwise, return just the spinner element
  return spinner;
}
