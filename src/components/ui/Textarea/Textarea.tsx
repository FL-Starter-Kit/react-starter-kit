import type { ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/utils/cn';

import styles from '../shared/FieldControl.module.css';

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

/** Multi-line text input. Use with FormField for label/error association. */
export function Textarea({ invalid = false, className, ref, ...rest }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(styles.control, styles.textarea, invalid && styles.invalid, className)}
      {...rest}
    />
  );
}
