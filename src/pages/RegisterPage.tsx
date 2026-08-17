/**
 * @file src/pages/RegisterPage.tsx
 * @description Authentication registration container view.
 *
 * @why-it-exists
 * Serves as the page-wrapper for the RegisterForm component.
 */

import RegisterForm from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex w-full justify-center items-center py-6 sm:py-12">
      <RegisterForm />
    </div>
  );
}
