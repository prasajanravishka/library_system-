/* ══════════════════════════════════════════════════════════════════════════
   CategoryForm — Add/Edit category form with React Hook Form + Zod validation
   ══════════════════════════════════════════════════════════════════════════ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Category } from '../../types/category.types';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Props {
  category?: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * CategoryForm Component
 * 
 * Renders a form for creating a new category or editing an existing one.
 * Includes fields for category name, description, and an icon identifier.
 * 
 * @param {Props} props - The component props.
 * @param {Category|null} [props.category] - Optional category object to populate form fields in edit mode.
 * @param {Function} props.onSubmit - Callback invoked with form data when validation passes.
 * @param {boolean} props.isSubmitting - Indicates whether the form is currently submitting.
 * @returns {JSX.Element} The rendered CategoryForm component.
 */
export default function CategoryForm({ category, onSubmit, isSubmitting }: Props) {
  // Initialize react-hook-form with Zod schema validation
  // Pre-fill values if an existing category is provided
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      icon: category?.icon || '',
    },
  });

  // Helper function to generate styling for inputs based on validation error state
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'focus:border-indigo-500 focus:ring-indigo-500'
    }`;
    
  // Shared Tailwind CSS classes for labels and error messages
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';
  const errorClass = 'text-xs text-red-600 mt-1.5 flex items-center gap-1 before:content-["•"]';

  // Render the form, delegating the submit event to react-hook-form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Category Name */}
      <div>
        <label className={labelClass}>Name *</label>
        <input {...register('name')} className={inputClass(!!errors.name)} placeholder="e.g. Science Fiction" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          className={inputClass(!!errors.description)}
          placeholder="Brief description of the category"
          rows={3}
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      {/* Icon Identifier */}
      <div>
        <label className={labelClass}>Icon Identifier</label>
        <input
          {...register('icon')}
          className={inputClass(!!errors.icon)}
          placeholder="e.g. BookOpen, Tags (lucide-react icon name)"
        />
        {errors.icon && <p className={errorClass}>{errors.icon.message}</p>}
        <p className="text-xs text-slate-500 mt-1.5">Enter the name of a Lucide React icon.</p>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {category ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  );
}

export type { CategoryFormData };
