import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

import styles from './IconButton.module.css';

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** Required — the button has no visible text and must be nameable. */
  'aria-label': string;
  variant?: 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

/** Square button that contains only an icon. The accessible name is required. */
export function IconButton({
  'aria-label': ariaLabel,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span aria-hidden={loading}>{children}</span>
      {loading && (
        <span className={styles.loading}>
          <Spinner size="sm" />
        </span>
      )}
    </button>
  );
}
