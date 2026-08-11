import type { ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/utils/cn';

import styles from './ChoiceControl.module.css';

export interface SwitchProps extends ComponentPropsWithoutRef<'button'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  invalid?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Accessible switch: a button with `role="switch"` and `aria-checked`.
 * Keyboard operable (Space/Enter) out of the box. Pair with a Label via
 * the standard `htmlFor`/`id` mechanism (or wrap in a labeled fieldset).
 */
export function Switch({ checked, onCheckedChange, invalid = false, className, ref, ...rest }: SwitchProps) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-invalid={invalid || undefined}
      className={cn(styles.switch, checked && styles.switchOn, className)}
      onClick={() => { onCheckedChange(!checked); }}
      {...rest}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}
