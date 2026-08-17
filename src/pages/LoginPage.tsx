/**
 * @file src/pages/LoginPage.tsx
 * @description Authentication login card container view.
 *
 * @why-it-exists
 * Serves as the page-wrapper for the LoginForm component.
 */

import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex w-full justify-center items-center py-6 sm:py-12">
      <LoginForm />
    </div>
  );
}
