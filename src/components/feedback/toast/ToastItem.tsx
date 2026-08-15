import * as RadixToast from '@radix-ui/react-toast';
import { useEffect, type AnimationEvent } from 'react';

import { cn } from '@/utils/cn';

import { dismissToast, removeToast } from './store';
import styles from './Toast.module.css';
import { ToastIcon } from './ToastIcon';
import type { ToastAction, ToastData } from './types';

/**
 * How long a dismissed toast may stay mounted when the exit animation never
 * fires (jsdom tests, unusual CSS environments). In browsers the
 * `animationend` handler removes the toast as soon as the exit animation ends.
 */
const EXIT_FALLBACK_MS = 600;

function actionAltText(action: ToastAction): string {
  if (typeof action.altText === 'string' && action.altText.trim() !== '') {
    return action.altText;
  }
  if (typeof action.label === 'string') {
    return action.label;
  }
  return 'Notification action';
}

/** A single toast. `open` is controlled by the store; dismissal animates out. */
export function ToastItem({ toast }: { toast: ToastData }) {
  const { id, variant } = toast;

  useEffect(() => {
    if (toast.status !== 'leaving') {
      return;
    }
    const timer = window.setTimeout(() => {
      removeToast(id);
    }, EXIT_FALLBACK_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast.status, id]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLLIElement>) => {
    if (event.target === event.currentTarget && event.currentTarget.dataset.state === 'closed') {
      removeToast(id);
    }
  };

  return (
    <RadixToast.Root
      type={variant === 'error' ? 'foreground' : 'background'}
      open={toast.status === 'active'}
      duration={toast.duration}
      className={cn(styles.toast, styles[variant])}
      onOpenChange={(open) => {
        if (!open) {
          dismissToast(id);
        }
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className={styles.icon} aria-hidden="true">
        <ToastIcon variant={variant} />
      </span>
      <div className={styles.body}>
        <RadixToast.Title className={styles.title}>{toast.title}</RadixToast.Title>
        {toast.description !== undefined && (
          <RadixToast.Description className={styles.description}>
            {toast.description}
          </RadixToast.Description>
        )}
      </div>
      {toast.action !== undefined && (
        <RadixToast.Action
          altText={actionAltText(toast.action)}
          className={styles.action}
          onClick={toast.action.onClick}
        >
          {toast.action.label}
        </RadixToast.Action>
      )}
      {toast.dismissible && (
        <RadixToast.Close className={styles.close} aria-label="Dismiss notification">
          <span aria-hidden="true">✕</span>
        </RadixToast.Close>
      )}
    </RadixToast.Root>
  );
}
