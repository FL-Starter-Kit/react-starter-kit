import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { Label } from '@/components/ui/Label';
import { cn } from '@/utils/cn';

import styles from './FormField.module.css';

export interface FormFieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Unique identifier shared with the control via htmlFor/id. */
  name: string;
  label: ReactNode;
  /** Optional hint text shown below the control. */
  hint?: ReactNode;
  /** Error message(s); renders with role="alert" and is associated via aria-describedby. */
  error?: ReactNode;
  /** Visually hide the label (still available to screen readers). */
  hideLabel?: boolean;
  /** The control element itself (Input, Select, Checkbox, ...). */
  children: (fieldId: string, describedById: string | undefined) => ReactNode;
  required?: boolean;
}

/**
 * Wraps a form control with an associated label, hint and error message.
 * All three are correctly linked with `id`/`htmlFor`/`aria-describedby`.
 */
export function FormField({
  name,
  label,
  hint,
  error,
  hideLabel = false,
  children,
  required = false,
  className,
  ...rest
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = `${name}-${autoId}`;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedById = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn(styles.field, className)} {...rest}>
      <Label htmlFor={fieldId} hideVisually={hideLabel}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </Label>
      {children(fieldId, describedById)}
      {hint !== undefined && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
