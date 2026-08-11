import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/utils/cn';

import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant;
}

/** Small status/classification label. Not interactive. */
export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], className)} {...rest}>
      {children}
    </span>
  );
}
