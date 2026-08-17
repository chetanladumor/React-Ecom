/**
 * @file src/components/ToastContainer.tsx
 * @description Renders stackable notification toast alerts managed in the global Redux state.
 *
 * @why-it-exists
 * Connects the global notification list inside the Redux store to the UI layout. 
 * Renders multiple floating alerts in the top-right corner of the application screen.
 *
 * @why-this-approach
 * - Separates the container shell from individual toast instances (`ToastItem`).
 * - Each `ToastItem` manages its own auto-dismiss timeout using `useEffect`, firing `removeNotification` on completion.
 *
 * @enterprise-considerations
 * - React 19 safety: Handles cleanup on unmounts to prevent memory leaks from running window timeouts.
 *
 * @react-commentaries
 * - Why state belongs in Redux: The toast queue belongs in Redux because notifications can be triggered from 
 *   API middleware queries (e.g., net connection errors) or distant page components (e.g., adding to cart), 
 *   requiring a single centralized visual queue.
 * - Why useCallback is used: `handleDismiss` is passed as a callback dependency to children. Wrapping it in 
 *   `useCallback` prevents child toasts from re-registering timeouts unnecessarily when the parent renders.
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeNotification, type NotificationItem } from '@/store/slices/notificationSlice';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function ToastContainer() {
  const notifications = useAppSelector((state) => state.notification.items);
  const dispatch = useAppDispatch();

  // Memoized dismiss handler to avoid re-creating references on parent re-renders
  const handleDismiss = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  return (
    <div className="fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      {notifications.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}

function ToastItem({ item, onDismiss }: ToastItemProps) {
  const { id, message, type, duration = 5000 } = item;

  // Set up auto-dismiss timer on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    // Clean up timer on component unmount
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  // Map icon based on warning types
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-100 dark:border-emerald-950';
      case 'error':
        return 'border-red-100 dark:border-red-950';
      case 'warning':
        return 'border-amber-100 dark:border-amber-950';
      case 'info':
      default:
        return 'border-blue-100 dark:border-blue-950';
    }
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg transition-all duration-300 dark:bg-neutral-900 ${getBorderColor()}`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {message}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 rounded-lg p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
