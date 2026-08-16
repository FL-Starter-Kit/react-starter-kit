import { cn } from '@/utils/cn';

import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Decorative loading indicator. The surrounding element must provide an
 * accessible announcement (e.g. `role="status"` or `aria-busy`) — the
 * spinner itself is hidden from assistive technology.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn(styles.spinner, styles[size], className)}
      role="presentation"
      aria-hidden="true"
    >
      <span className={styles.inner} />
    </span>
  );
}
