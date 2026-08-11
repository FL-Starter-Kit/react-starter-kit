import type { ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/utils/cn';

import styles from './ChoiceControl.module.css';

export interface CheckboxProps extends ComponentPropsWithoutRef<'input'> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Native checkbox (keyboard accessible by default). */
export function Checkbox({ invalid = false, className, ref, ...rest }: CheckboxProps) {
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-invalid={invalid || undefined}
      className={cn(styles.control, className)}
      {...rest}
    />
  );
}
