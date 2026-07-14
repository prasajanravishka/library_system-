/* ══════════════════════════════════════════════════════════════════════════
   LocationForm — Add/Edit location form with React Hook Form + Zod validation
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Location } from '../../types/location.types';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  floor: z.string().optional(),
  rack_no: z.string().optional(),
  description: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface Props {
  location?: Location | null;
  onSubmit: (data: LocationFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * LocationForm Component
 * 
 * Renders a form for adding a new location or editing an existing location.
 * Provides inputs for name, floor, and description.
 * 
 * @param {Props} props - The component props.
 * @param {Location|null} [props.location] - The location data to edit. If null, operates in create mode.
 * @param {Function} props.onSubmit - Function executed upon valid form submission.
 * @param {boolean} props.isSubmitting - Indicates if the form submission is in progress.
 * @returns {JSX.Element} The rendered LocationForm component.
 */
export default function LocationForm({ location, onSubmit, isSubmitting }: Props) {
  // Initialize react-hook-form with Zod validation
  // Populate form with existing location data if in edit mode
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(locationSchema) as any,
    defaultValues: {
      name: location?.name || '',
      floor: location?.floor || '',
      rack_no: location?.rack_no || '',
      description: location?.description || '',
    },
  });

  const floorValue = watch('floor');
  const rackValue = watch('rack_no');

  useEffect(() => {
    if (floorValue && rackValue) {
      const proposedName = `${floorValue} - ${rackValue}`;
      setValue('name', proposedName, { shouldValidate: true, shouldDirty: true });
    }
  }, [floorValue, rackValue, setValue]);

  // Generates conditional styling for input elements, highlighting errors if present
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'focus:border-indigo-500 focus:ring-indigo-500'
    }`;
    
  // Constants for standard label and error message styling
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';
  const errorClass = 'text-xs text-red-600 mt-1.5 flex items-center gap-1 before:content-["•"]';

  // Render form wrapper and attach submission handler
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Location Name */}
      <div>
        <label className={labelClass}>Name *</label>
        <input {...register('name')} className={inputClass(!!errors.name)} placeholder="e.g. Main Hall" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Floor & Rack No */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Floor</label>
          <select {...register('floor')} className={inputClass(!!errors.floor)}>
            <option value="">Select Floor</option>
            <option value="Floor 1">Floor 1</option>
            <option value="Floor 2">Floor 2</option>
          </select>
          {errors.floor && <p className={errorClass}>{errors.floor.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Rack No</label>
          <select {...register('rack_no')} className={inputClass(!!errors.rack_no)}>
            <option value="">Select Rack</option>
            <option value="Rack A">Rack A</option>
            <option value="Rack B">Rack B</option>
            <option value="Rack C">Rack C</option>
            <option value="Rack D">Rack D</option>
            <option value="Rack E">Rack E</option>
            <option value="Rack F">Rack F</option>
          </select>
          {errors.rack_no && <p className={errorClass}>{errors.rack_no.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          className={inputClass(!!errors.description)}
          placeholder="Brief description of the location"
          rows={3}
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {location ? 'Update Location' : 'Add Location'}
        </button>
      </div>
    </form>
  );
}

export type { LocationFormData };
