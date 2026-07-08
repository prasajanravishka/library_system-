import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Props for the EmptyState component.
 * @property {LucideIcon} icon - The Lucide icon component to display.
 * @property {string} title - The main title text for the empty state.
 * @property {string} description - The descriptive text explaining the empty state.
 * @property {string} [className] - Optional additional CSS classes.
 */
interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/**
 * EmptyState component displays a placeholder UI when there is no data to show.
 * It features a centered icon, a title, and a brief description.
 *
 * @param {Props} props - The component props.
 * @returns {JSX.Element} The rendered empty state component.
 */
export default function EmptyState({ icon: Icon, title, description, className }: Props) {
  // Renders a container with centered flex layout
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      {/* Icon container with circular background */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Icon size={32} className="text-slate-500" />
      </div>
      {/* Title text */}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {/* Description text */}
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
