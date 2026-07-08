/* ══════════════════════════════════════════════════════════════════════════
   Badge — Status badge with color variants
   ══════════════════════════════════════════════════════════════════════════ */

import { cn, capitalize } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/constants';

/**
 * Props for the Badge component.
 * @property {string} status - The status string to display (e.g., 'active', 'pending'). Determines the color.
 * @property {string} [className] - Optional additional CSS classes for styling.
 */
interface Props {
  status: string;
  className?: string;
}

/**
 * Badge component renders a styled text span indicating a status.
 * It automatically maps the status string to specific background and text colors.
 *
 * @param {Props} props - The properties for the Badge component.
 * @returns {JSX.Element} The rendered badge element.
 */
export default function Badge({ status, className }: Props) {
  // Determine the color styling based on the status, falling back to default slate colors if not found
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-500/15', text: 'text-slate-400' };

  // Render the badge span with dynamic classes and capitalized text
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
