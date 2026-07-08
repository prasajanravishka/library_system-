/* ══════════════════════════════════════════════════════════════════════════
   UserForm — Add/Edit user form with React Hook Form + Zod validation
   ══════════════════════════════════════════════════════════════════════════ */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { User } from '../../types/user.types';

const userSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  account_status: z.enum(['active', 'suspended']).default('active'),
});

type UserFormData = z.infer<typeof userSchema>;

interface Props {
  user?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * UserForm Component
 * 
 * Renders a form for adding a new user or editing an existing user.
 * Captures user details such as student ID, name, email, password, and account status.
 * 
 * @param {Props} props - The component props.
 * @param {User|null} [props.user] - Optional user data for edit mode. If null, the form is for a new user.
 * @param {Function} props.onSubmit - Callback invoked with valid form data on submission.
 * @param {boolean} props.isSubmitting - Tracks the loading state of the submission process.
 * @returns {JSX.Element} The rendered UserForm component.
 */
export default function UserForm({ user, onSubmit, isSubmitting }: Props) {
  // Initialize react-hook-form with Zod schema validation
  // Provide default values based on the 'user' prop to support editing
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      student_id: user?.student_id || '',
      full_name: user?.full_name || '',
      email: user?.email || '',
      password: '',
      account_status: user?.account_status || 'active',
    },
  });

  // Helper method to compute conditional class names for input fields based on validation state
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'focus:border-indigo-500 focus:ring-indigo-500'
    }`;
    
  // Standardized CSS classes for form labels and validation error messages
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';
  const errorClass = 'text-xs text-red-600 mt-1.5 flex items-center gap-1 before:content-["•"]';

  // Render the user form fields and attach the submit event handler
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Student ID */}
        <div>
          <label className={labelClass}>Student ID *</label>
          <input {...register('student_id')} className={inputClass(!!errors.student_id)} placeholder="e.g. S12345" />
          {errors.student_id && <p className={errorClass}>{errors.student_id.message}</p>}
        </div>

        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Name *</label>
          <input {...register('full_name')} className={inputClass(!!errors.full_name)} placeholder="John Doe" />
          {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" {...register('email')} className={inputClass(!!errors.email)} placeholder="john@example.com" />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Password - Only show for new users (optional) or if we want to allow password resets */}
      {/* Conditionally render password field only when creating a new user */}
      {!user && (
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            {...register('password')}
            className={inputClass(!!errors.password)}
            placeholder="Set a default password"
          />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          <p className="text-xs text-slate-500 mt-1.5">Leave blank to use a default or auto-generated password.</p>
        </div>
      )}

      {/* Account Status */}
      <div>
        <label className={labelClass}>Account Status</label>
        <select {...register('account_status')} className={inputClass(!!errors.account_status)}>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        {errors.account_status && <p className={errorClass}>{errors.account_status.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {user ? 'Update User' : 'Add User'}
        </button>
      </div>
    </form>
  );
}

export type { UserFormData };
