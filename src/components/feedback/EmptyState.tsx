import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Action shown under the description (e.g. "Create first user"). */
  action?: ReactNode;
  /** Decorative illustration/icon area. */
  illustration?: ReactNode;
  className?: string;
}

/** Friendly empty-data state with a clear next step. */
export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(styles.root, className)}>
      {illustration !== undefined && (
        <div className={styles.illustration} aria-hidden="true">
          {illustration}
        </div>
      )}
      <h2 className={styles.title}>{title}</h2>
      {description !== undefined && <p className={styles.description}>{description}</p>}
      {action !== undefined && <div className={styles.action}>{action}</div>}
    </div>
  );
}
