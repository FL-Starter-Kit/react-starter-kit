import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

import styles from './ErrorState.module.css';

export interface ErrorStateProps extends ComponentPropsWithoutRef<'div'> {
  /** Short, user-safe title (never stack traces or internals). */
  title?: string;
  description?: ReactNode;
  /** Retry handler. When provided, a "Try again" button is rendered. */
  onRetry?: () => void;
  /** Extra actions (e.g. "Go to home page"). */
  actions?: ReactNode;
}

/** Error fallback UI. Never expose technical details to end users. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  actions,
  className,
  ...rest
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn(styles.root, className)} {...rest}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>
        {onRetry !== undefined && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
