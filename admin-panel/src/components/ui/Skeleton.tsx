import React from 'react';

/**
 * Props for the Skeleton component, inheriting standard div attributes.
 * @property {string} [className] - Optional additional CSS classes to shape or style the skeleton.
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton component renders an animated placeholder shape, commonly used 
 * to indicate loading state before actual content is available.
 *
 * @param {SkeletonProps} props - The component props including optional classNames.
 * @returns {JSX.Element} The rendered skeleton block.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  // Render a div with a pulse animation and base styling, merging custom classes and props
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-md ${className}`}
      {...props}
    />
  );
};
