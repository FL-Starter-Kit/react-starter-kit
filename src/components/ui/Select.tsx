import type { ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/utils/cn';

import styles from './FieldControl.module.css';

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  invalid?: boolean;
  ref?: Ref<HTMLSelectElement>;
}

/** Native select (accessible by default — no custom ARIA needed). */
export function Select({ invalid = false, className, ref, children, ...rest }: SelectProps) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(styles.control, styles.select, invalid && styles.invalid, className)}
      {...rest}
    >
      {children}
    </select>
  );
}
