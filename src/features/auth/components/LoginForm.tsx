/**
 * @file src/features/auth/components/LoginForm.tsx
 * @description Login Form component with schema-based Zod validation and premium Tailwind styling.
 *
 * @why-it-exists
 * Provides the interactive login card for user credential inputs. Connects inputs 
 * to the `useLoginMutation` hook to verify credentials against the backend.
 *
 * @why-this-approach
 * - Uses `react-hook-form` to manage form states efficiently without causing root page re-renders on keystroke.
 * - Bridges Zod schema validations using `@hookform/resolvers/zod`.
 * - Accesses navigation states (`useLocation`, `useNavigate`) to return users to their requested page post-login.
 *
 * @enterprise-considerations
 * - Interactive validation: Disables the submit button and overlays spinners during network requests.
 * - Accessibility (a11y): Employs descriptive `aria-invalid` and `role="alert"` attributes for screen-reader compatibility.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router';
import { useLoginMutation } from '../services/authApi';
import { loginSchema, type LoginInput } from '../types/authSchemas';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  // Extract navigation redirect path (default to products if none provided)
  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname || '/products';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login submission failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Welcome Back</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to your account to continue shopping
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Username
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <User size={18} />
            </span>
            <input
              id="username"
              type="text"
              placeholder="e.g. johnd"
              {...register('username')}
              aria-invalid={!!errors.username}
              className={`w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                errors.username
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700'
              }`}
            />
          </div>
          {errors.username && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-500">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Password
            </label>
          </div>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={!!errors.password}
              className={`w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Demo Hint */}
        <div className="rounded-lg bg-brand-50/50 p-3 text-xs text-brand-850 dark:bg-brand-950/20 dark:text-brand-350">
          <span className="font-bold">Demo Credentials:</span> Use username <code className="font-mono bg-brand-100/50 px-1 rounded dark:bg-brand-900/50">johnd</code> (Admin) or <code className="font-mono bg-brand-100/50 px-1 rounded dark:bg-brand-900/50">morrison</code> (User) with password <code className="font-mono bg-brand-100/50 px-1 rounded dark:bg-brand-900/50">m38rmF_</code>.
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-650 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:bg-neutral-350 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Create one
        </Link>
      </div>
    </div>
  );
}
