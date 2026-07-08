/* ══════════════════════════════════════════════════════════════════════════
   Utility Functions
   ══════════════════════════════════════════════════════════════════════════ */

/** 
 * Merge CSS class names, filtering out falsy values. 
 * @param classes - Array of class names or falsy values to be merged.
 * @returns A single string containing the merged class names.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  // Filter out any falsy values (e.g., false, null, undefined) and join the remaining strings with a space
  return classes.filter(Boolean).join(' ');
}

/** 
 * Format a date string to a human-readable locale string. 
 * @param dateStr - The date string to format.
 * @returns The formatted date string, or a fallback string if the input is invalid or missing.
 */
export function formatDate(dateStr: string | null | undefined): string {
  // Return a placeholder if the date string is not provided
  if (!dateStr) return '—';
  try {
    // Attempt to parse and format the date string
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    // Fallback to the original date string if parsing fails
    return dateStr;
  }
}

/** 
 * Format a date string as relative time (e.g. "3 days ago"). 
 * @param dateStr - The date string to calculate the relative time for.
 * @returns A string representing the relative time.
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  
  // Calculate the difference in milliseconds between now and the past date
  const diffMs = now.getTime() - past.getTime();
  
  // Convert the difference from milliseconds to days
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Determine the appropriate relative time string based on the difference in days
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/** 
 * Capitalize the first letter of a string. 
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(str: string): string {
  // Capitalize the first character and append the rest of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 
 * Extract a user-friendly error message from an Axios error. 
 * @param error - The error object to extract the message from.
 * @returns The extracted error message.
 */
export function getErrorMessage(error: unknown): string {
  // If the error is already a string, return it directly
  if (typeof error === 'string') return error;
  
  // Cast the error to a more specific type to access potential nested properties
  const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
  
  // Attempt to extract the error detail from the response data, fallback to the error message, or use a default message
  return axiosError?.response?.data?.detail || axiosError?.message || 'An unexpected error occurred.';
}
