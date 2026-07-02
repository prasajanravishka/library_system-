/* ══════════════════════════════════════════════════════════════════════════
   Utility Functions
   ══════════════════════════════════════════════════════════════════════════ */

/** Merge CSS class names, filtering out falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format a date string to a human-readable locale string. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Format a date string as relative time (e.g. "3 days ago"). */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/** Capitalize the first letter of a string. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Extract a user-friendly error message from an Axios error. */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
  return axiosError?.response?.data?.detail || axiosError?.message || 'An unexpected error occurred.';
}
