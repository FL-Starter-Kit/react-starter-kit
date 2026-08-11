import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './ChoiceControl.module.css';

export interface RadioGroupProps extends ComponentPropsWithoutRef<'fieldset'> {
  legend: ReactNode;
}

/** Fieldset/legend wrapper that groups radio options. */
export function RadioGroup({ legend, className, children, ...rest }: RadioGroupProps) {
  return (
    <fieldset className={cn(styles.group, className)} {...rest}>
      <legend className={styles.legend}>{legend}</legend>
      {children}
    </fieldset>
  );
}

export interface RadioProps extends ComponentPropsWithoutRef<'input'> {
  label: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
}

/** Native radio inside a labeled option row. */
export function Radio({ label, hint, invalid = false, className, children, ...rest }: RadioProps) {
  return (
    <label className={cn(styles.option, invalid && styles.invalidOption, className)}>
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-invalid is a global ARIA attribute and is how form errors are exposed on radios */}
      <input type="radio" className={styles.radio} aria-invalid={invalid || undefined} {...rest} />
      <span className={styles.optionText}>
        <span>{label}</span>
        {hint !== undefined && <span className={styles.hint}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}
