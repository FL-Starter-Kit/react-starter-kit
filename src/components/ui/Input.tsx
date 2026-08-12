import type { ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/utils/cn';

import styles from './FieldControl.module.css';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Text input. Use with FormField for label/error association. */
export function Input({ invalid = false, className, ref, ...rest }: InputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(styles.control, invalid && styles.invalid, className)}
      {...rest}
    />
  );
}
