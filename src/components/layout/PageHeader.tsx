import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  /** Optional eyebrow/label above the title (e.g. feature name). */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Actions aligned to the end of the header row. */
  actions?: ReactNode;
  className?: string;
}

/** Page header with a single <h1>, description and action slot. */
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      <div>
        {eyebrow !== undefined && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description !== undefined && <p className={styles.description}>{description}</p>}
      </div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
