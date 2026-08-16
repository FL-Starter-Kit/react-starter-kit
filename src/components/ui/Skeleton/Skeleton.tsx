import { cn } from '@/utils/cn';

import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  /** Height of the placeholder, e.g. "1rem" or "2.5rem". */
  height?: string;
  /** Width of the placeholder. Defaults to 100%. */
  width?: string;
}

/**
 * Loading placeholder for content that has not loaded yet.
 * Decorative (`aria-hidden`) — the surrounding container must carry the
 * accessible loading announcement.
 */
export function Skeleton({ className, height = '1rem', width = '100%' }: SkeletonProps) {
  return (
    <span className={cn(styles.skeleton, className)} style={{ height, width }} aria-hidden="true" />
  );
}
