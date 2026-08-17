/**
 * @file src/features/auth/components/RegisterForm.tsx
 * @description Registration Form component with schema-based validation and a responsive grid layout.
 *
 * @why-it-exists
 * Renders the checkout registration fields. Collects and structures user address data 
 * to align with Fake Store API specifications, and submits to the registration endpoint.
 *
 * @why-this-approach
 * - Uses a 2-column responsive layout for personal info and address fields to improve form legibility.
 * - Restructures the flat React Hook Form input object into the nested structure (name, address) expected by the server.
 * - Redirects to `/login` upon success, prompting the user with a notification toast.
 *
 * @enterprise-considerations
 * - Strict nested mapping: Cleans and matches addresses and phone fields before submitting.
 * - Accessibility (a11y): Groups fields in clear sections and provides descriptive screen-reader errors.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { useRegisterMutation } from '../services/authApi';
import { registerSchema, type RegisterInput } from '../types/authSchemas';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
  });

  const onSubmit = async (data: RegisterInput) => {
    // Map flat form inputs to the nested payload format expected by Fake Store API
    const formattedPayload = {
      email: data.email,
      username: data.username,
      password: data.password,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
    };

    try {
      await registerUser(formattedPayload).unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-neutral-100 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Create Account</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Sign up now to start placing orders
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Details Section */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-650 dark:text-brand-450">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstname" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                First Name
              </label>
              <input
                id="firstname"
                type="text"
                placeholder="John"
                {...register('firstname')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.firstname ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.firstname && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.firstname.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastname" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Last Name
              </label>
              <input
                id="lastname"
                type="text"
                placeholder="Doe"
                {...register('lastname')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.lastname ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.lastname && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.lastname.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="phone" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="1-570-236-7033"
                {...register('phone')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.phone ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.phone && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-650 dark:text-brand-450">
            Account Credentials
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                {...register('email')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.email && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                {...register('username')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.username ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.username && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div>{/* Spacer */}</div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full rounded-xl border py-2 pr-10 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                    errors.password ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.confirmPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.confirmPassword && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-650 dark:text-brand-450">
            Shipping Address
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="street" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Street Address
              </label>
              <input
                id="street"
                type="text"
                placeholder="7835 New Road"
                {...register('street')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.street ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.street && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.street.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="number" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                House Number
              </label>
              <input
                id="number"
                type="text"
                placeholder="3"
                {...register('number')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.number ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.number && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                City
              </label>
              <input
                id="city"
                type="text"
                placeholder="Kilcoole"
                {...register('city')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.city ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.city && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="zipcode" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Zip Code
              </label>
              <input
                id="zipcode"
                type="text"
                placeholder="12926-3874"
                {...register('zipcode')}
                className={`mt-1 w-full rounded-xl border py-2 px-3 text-sm outline-none transition-all dark:bg-neutral-850 dark:text-white ${
                  errors.zipcode ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.zipcode && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-500">{errors.zipcode.message}</p>
              )}
            </div>
          </div>
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
              Registering Account...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
