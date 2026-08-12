import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '@/utils/cn';

import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  /** Link label. */
  label: ReactNode;
  /** Path this crumb points to. Omit on the final crumb. */
  to?: string;
}

export interface BreadcrumbsProps extends ComponentPropsWithoutRef<'nav'> {
  items: readonly BreadcrumbItem[];
  /** Accessible label for the navigation landmark. */
  'aria-label'?: string;
}

/** Breadcrumb navigation. Each crumb is a link; the last is current. */
export function Breadcrumbs({
  items,
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
  ...rest
}: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className={cn(styles.root, className)} {...rest}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={styles.item}>
              {item.to !== undefined && !isLast ? (
                <Link to={item.to} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className={styles.current}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
