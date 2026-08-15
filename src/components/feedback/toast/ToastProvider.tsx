import * as RadixToast from '@radix-ui/react-toast';
import { useSyncExternalStore } from 'react';

import { cn } from '@/utils/cn';

import { getToastsServerSnapshot, getToastsSnapshot, subscribeToasts } from './store';
import styles from './Toast.module.css';
import { ToastItem } from './ToastItem';

export interface ToastProviderProps {
  /** Accessible name used in announcements. Defaults to "Notification". */
  label?: string;
  /** Where the toast stack is anchored. Defaults to 'bottom-right'. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /**
   * Default auto-dismiss delay (ms) for toasts without an explicit duration.
   * The per-variant defaults in the store apply when this is not set.
   */
  defaultDuration?: number;
  /**
   * Element to append the screen-reader announcements to. Useful inside focus
   * traps/modals that make other elements inert. Defaults to document.body.
   */
  announcerContainer?: Element | DocumentFragment;
}

/**
 * Application-wide toast system. Mount once near the app root; call the
 * imperative `toast.success(...)` API from anywhere. Built on Radix Toast,
 * which provides the live-region announcements, pause-on-hover/focus timers,
 * swipe-to-dismiss and focus management.
 */
export function ToastProvider({
  label = 'Notification',
  position = 'bottom-right',
  defaultDuration = 5000,
  announcerContainer,
}: ToastProviderProps) {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsServerSnapshot);

  return (
    <RadixToast.Provider
      label={label}
      swipeDirection="right"
      {...(defaultDuration !== undefined && { duration: defaultDuration })}
      {...(announcerContainer !== undefined && { announcerContainer })}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
      <RadixToast.Viewport className={cn(styles.viewport, styles[position])} />
    </RadixToast.Provider>
  );
}
