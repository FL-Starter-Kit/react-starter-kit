import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a loading spinner and disable the button. */
  loading?: boolean;
  /** Text announced to screen readers while loading. */
  loadingLabel?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Loading',
  fullWidth = false,
  icon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      {...rest}
    >
      <span className={styles.content} aria-hidden={loading}>
        {icon !== undefined && !loading && <span className={styles.icon}>{icon}</span>}
        {children}
      </span>
      {loading && (
        <span className={styles.loading} role="status">
          <Spinner size="sm" />
          <span className="visually-hidden">{loadingLabel}</span>
        </span>
      )}
    </button>
  );
}
