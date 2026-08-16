import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './Accordion.module.css';

export interface AccordionItemProps extends Omit<ComponentPropsWithoutRef<'details'>, 'summary'> {
  summary: ReactNode;
}

/**
 * Native <details>/<summary> accordion — keyboard accessible and
 * screen-reader friendly with zero custom ARIA. `open` is optional:
 * leave uncontrolled for a simple disclosure, or control it externally
 * via the `open`/`onToggle` props.
 */
export function AccordionItem({ summary, className, children, ...rest }: AccordionItemProps) {
  return (
    <details className={cn(styles.item, className)} {...rest}>
      <summary className={styles.summary}>{summary}</summary>
      <div className={styles.content}>{children}</div>
    </details>
  );
}
