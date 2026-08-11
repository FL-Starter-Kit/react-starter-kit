import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/utils/cn';

import styles from './Label.module.css';

export interface LabelProps extends ComponentPropsWithoutRef<'label'> {
  /** Visually hide the label while keeping it in the accessibility tree. */
  hideVisually?: boolean;
}

/**
 * Presentational label primitive. The control association (`htmlFor`)
 * is provided by the caller (e.g. FormField), so the built-in check
 * cannot see it — disabled here by design, tested via axe instead.
 */
/* eslint-disable jsx-a11y/label-has-associated-control */
export function Label({ className, hideVisually = false, ...rest }: LabelProps) {
  return <label className={cn(!hideVisually && styles.label, hideVisually && 'visually-hidden', className)} {...rest} />;
}
