/* ══════════════════════════════════════════════════════════════════════════
   Modal — Overlay dialog with glassmorphism backdrop
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Props for the Modal component.
 * @property {boolean} isOpen - Determines if the modal is currently visible.
 * @property {() => void} onClose - Callback function triggered to close the modal.
 * @property {string} title - The title text displayed in the modal header.
 * @property {React.ReactNode} children - The inner content of the modal body.
 * @property {'sm' | 'md' | 'lg' | 'xl'} [size] - Optional size variant restricting maximum width.
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Map of size identifiers to tailwind max-width classes
const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modal component provides an overlay dialog box for focused content.
 * It handles keyboard interactions (e.g., closing on Escape) and body scroll locking.
 *
 * @param {Props} props - The component props.
 * @returns {JSX.Element | null} The rendered modal or null if not open.
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }: Props) {
  // Ref used to detect clicks on the modal backdrop overlay
  const overlayRef = useRef<HTMLDivElement>(null);

  // Effect to manage 'Escape' key press and body overflow hiding
  useEffect(() => {
    // Function to handle keydown events and trigger onClose if Escape is pressed
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      // Add event listener for 'Escape' key when modal opens
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      // Cleanup event listener and body styles when modal closes or unmounts
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // If the modal is not open, render nothing
  if (!isOpen) return null;

  // Render the modal overlay and content
  return (
    <div
      ref={overlayRef}
      // Trigger onClose when the backdrop itself is clicked (not the modal content)
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={cn(
          'w-full bg-white rounded-2xl shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200',
          sizeMap[size]
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {/* Close button in header */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-[0.97]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
