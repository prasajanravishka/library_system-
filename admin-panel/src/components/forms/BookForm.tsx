/* ══════════════════════════════════════════════════════════════════════════
   BookForm — Add/Edit book form with React Hook Form + Zod validation
   ══════════════════════════════════════════════════════════════════════════ */

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Book } from '../../types/book.types';
import type { Category } from '../../types/category.types';
import type { Location } from '../../types/location.types';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  isbn: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  publication_year: z.coerce.number().optional(),
  language: z.string().optional(),
  location_id: z.coerce.number().optional(),
  cover_image_url: z.string().optional(),
  synopsis: z.string().optional(),
  keywords: z.string().optional(),
  copies: z.array(z.object({ barcode: z.string() })).optional(),
  category_ids: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(Number);
    if (typeof val === 'string') return [Number(val)];
    if (val === false || val === undefined) return [];
    return [];
  }, z.array(z.number())).optional(),
});

type BookFormData = z.infer<typeof bookSchema>;

interface Props {
  book?: Book | null;
  categories?: Category[];
  locations?: Location[];
  onSubmit: (data: BookFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * BookForm Component
 * 
 * Renders a form to add a new book or edit an existing one.
 * Includes fields for book details, multiple copies, and categories.
 * 
 * @param {Props} props - The component props.
 * @param {Book|null} [props.book] - Optional book data for edit mode.
 * @param {Category[]} [props.categories] - Array of categories for the selection list.
 * @param {Location[]} [props.locations] - Array of locations for the selection list.
 * @param {Function} props.onSubmit - Function called upon valid form submission.
 * @param {boolean} props.isSubmitting - Loading state for the submit button.
 * @returns {JSX.Element} The rendered BookForm component.
 */
export default function BookForm({ book, categories = [], locations = [], onSubmit, isSubmitting }: Props) {
  // Initialize react-hook-form with Zod schema validation
  // Set default values based on whether a book object is provided (edit mode) or not (create mode)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookSchema) as any,
    defaultValues: {
      title: book?.title || '',
      isbn: book?.isbn || '',
      author: book?.author || '',
      publisher: book?.publisher || '',
      publication_year: book?.publication_year || undefined,
      language: book?.language || 'English',
      location_id: book?.location_id || undefined,
      cover_image_url: book?.cover_image_url || '',
      synopsis: book?.synopsis || '',
      keywords: book?.keywords || '',
      category_ids: [],
      copies: book?.copies && book.copies.length > 0
        ? book.copies.map(c => ({ barcode: c.barcode }))
        : [{ barcode: '' }],
    },
  });

  // Setup field array for dynamic copy inputs, allowing multiple copies to be added at once
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });

  // Helper function to generate input styles based on error state
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'focus:border-indigo-500 focus:ring-indigo-500'
    }`;
    
  // Reusable utility classes for labels and error messages
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';
  const errorClass = 'text-xs text-red-600 mt-1.5 flex items-center gap-1 before:content-["•"]';

  // Render the form, binding the onSubmit handler via react-hook-form's handleSubmit
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div>
        <label className={labelClass}>Title *</label>
        <input {...register('title')} className={inputClass(!!errors.title)} placeholder="Enter book title" />
        {errors.title && <p className={errorClass}>{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ISBN & Author */}
        <div>
          <label className={labelClass}>ISBN</label>
          <input {...register('isbn')} className={inputClass(!!errors.isbn)} placeholder="e.g. 978-3-16-148410-0" />
          {errors.isbn && <p className={errorClass}>{errors.isbn.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Author</label>
          <input {...register('author')} className={inputClass(!!errors.author)} placeholder="Author name" />
          {errors.author && <p className={errorClass}>{errors.author.message}</p>}
        </div>

        {/* Publisher & Year */}
        <div>
          <label className={labelClass}>Publisher</label>
          <input {...register('publisher')} className={inputClass(!!errors.publisher)} placeholder="Publisher name" />
          {errors.publisher && <p className={errorClass}>{errors.publisher.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Publication Year</label>
          <input
            type="number"
            {...register('publication_year')}
            className={inputClass(!!errors.publication_year)}
            placeholder="2024"
          />
          {errors.publication_year && <p className={errorClass}>{errors.publication_year.message}</p>}
        </div>

        {/* Language & Location ID */}
        <div>
          <label className={labelClass}>Language</label>
          <select {...register('language')} className={inputClass(!!errors.language)}>
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
            <option value="Tamil">Tamil</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Russian">Russian</option>
            <option value="Arabic">Arabic</option>
            <option value="Hindi">Hindi</option>
            <option value="Korean">Korean</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
          </select>
          {errors.language && <p className={errorClass}>{errors.language.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <select
            {...register('location_id')}
            className={inputClass(!!errors.location_id)}
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.name} {loc.floor ? `(${loc.floor})` : ''}
              </option>
            ))}
          </select>
          {errors.location_id && <p className={errorClass}>{errors.location_id.message}</p>}
        </div>
      </div>

      {/* Cover Image URL */}
      <div>
        <label className={labelClass}>Cover Image URL</label>
        <input {...register('cover_image_url')} className={inputClass(!!errors.cover_image_url)} placeholder="https://..." />
        {errors.cover_image_url && <p className={errorClass}>{errors.cover_image_url.message}</p>}
      </div>

      {/* Synopsis */}
      <div>
        <label className={labelClass}>Synopsis</label>
        <textarea
          {...register('synopsis')}
          className={`${inputClass(!!errors.synopsis)} resize-y min-h-[100px]`}
          placeholder="Brief summary or description of the book..."
        />
        {errors.synopsis && <p className={errorClass}>{errors.synopsis.message}</p>}
      </div>

      {/* Keywords */}
      <div>
        <label className={labelClass}>Keywords / Tags</label>
        <input 
          {...register('keywords')} 
          className={inputClass(!!errors.keywords)} 
          placeholder="e.g. sci-fi, space, future (comma separated)" 
        />
        {errors.keywords && <p className={errorClass}>{errors.keywords.message}</p>}
      </div>

      {/* Book Copies (Barcodes & ISBNs) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " !mb-0"}>Book Copies (Barcode)</label>
          <button
            type="button"
            onClick={() => append({ barcode: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Add Another Copy
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`copies.${index}.barcode` as const)}
                className={inputClass(!!errors.copies?.[index]?.barcode)}
                placeholder={`Copy ${index + 1} Barcode`}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Remove copy"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Categories (checkboxes) */}
      {/* Conditionally render category checkboxes for new books if categories exist */}
      {!book && categories.length > 0 && (
        <div className="pt-2">
          <label className={labelClass}>Categories</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={cat.id}
                  {...register('category_ids')}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      {/* Render the submit button with loading state support */}
      <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {book ? 'Update Book' : 'Add Book'}
        </button>
      </div>
    </form>
  );
}

export type { BookFormData };
