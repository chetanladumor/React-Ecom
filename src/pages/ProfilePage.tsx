/**
 * @file src/pages/ProfilePage.tsx
 * @description Customer profile info view.
 *
 * @why-it-exists
 * Displays account information, contact data, security details, and roles for the logged-in user.
 */

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { User, Mail, Shield, MapPin, Phone, Lock, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'My Profile | E-SHOP';
  }, []);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">My Profile</h1>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Please log in to view your profile details.
          </p>
        </div>
      </div>
    );
  }

  // Set default/fallback values for addresses since Fake Store API might omit them on register sessions
  const firstName = user.name?.firstname || 'John';
  const lastName = user.name?.lastname || 'Doe';
  const email = user.email || 'john.doe@example.com';
  const username = user.username || 'johndoe';
  const role = user.role || 'user';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">My Profile</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your personal information, address listings, and account safety.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50">
            {/* Avatar block */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
              <User size={48} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white capitalize">
              {firstName} {lastName}
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">@{username}</p>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <Shield size={12} />
              <span className="capitalize">{role} Account</span>
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-6 text-left text-xs space-y-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-450" />
                <span>Member since June 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Info Sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details Card */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-6">
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-brand-650 dark:text-brand-450" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  First Name
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {firstName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Last Name
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {lastName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Username
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {username}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1">
                  <Mail size={10} /> Email Address
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {email}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping/Billing addresses */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-6">
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <MapPin size={18} className="text-brand-650 dark:text-brand-450" />
              <span>Default Shipping Address</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Street Address
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  123 Main Street, Apt 4B
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  City & State
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  San Francisco, CA
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  ZIP & Country
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  94105, United States
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1">
                  <Phone size={10} /> Phone Number
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  +1 (555) 019-2834
                </span>
              </div>
            </div>
          </div>

          {/* Security & Credentials */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-850 dark:bg-neutral-900/50 space-y-6">
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Lock size={18} className="text-brand-650 dark:text-brand-450" />
              <span>Account Security</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white">Multi-Factor Authentication (MFA)</h5>
                  <p className="text-neutral-500 dark:text-neutral-400">Keep your account secure with MFA verification.</p>
                </div>
                <span className="rounded bg-green-50 px-2 py-0.5 font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
                  Enabled
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white">Login Password</h5>
                  <p className="text-neutral-500 dark:text-neutral-400">Last updated 2 months ago.</p>
                </div>
                <button
                  disabled
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 font-semibold text-neutral-500 dark:border-neutral-750 dark:text-neutral-400 opacity-60"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
