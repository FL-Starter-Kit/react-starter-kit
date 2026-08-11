import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './Alert.module.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  variant?: AlertVariant;
  title?: ReactNode;
  children: ReactNode;
  /** Dismiss button label. When provided, the alert becomes dismissible. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * User-facing status message.
 * - `danger`: role="alert" (assertive announcement)
 * - others: role="status" (polite announcement)
 */
export function Alert({ variant = 'info', title, children, onDismiss, dismissLabel = 'Dismiss', className, ...rest }: AlertProps) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return (
    <div
      role={role}
      className={cn(styles.alert, styles[variant], className)}
      {...rest}
    >
      <div className={styles.content}>
        {title !== undefined && <p className={styles.title}>{title}</p>}
        <div className={styles.body}>{children}</div>
      </div>
      {onDismiss !== undefined && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label={dismissLabel}>
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}
