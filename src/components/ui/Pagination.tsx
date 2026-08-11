import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/utils/cn';

import styles from './Pagination.module.css';

export interface PaginationProps extends ComponentPropsWithoutRef<'nav'> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible label for the navigation landmark. */
  'aria-label'?: string;
  /** Display a page-size selector alongside the pager. */
  pageSize?: number;
  pageSizes?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

const siblings = 1;

function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return range(1, total);
  }
  const pages = new Set<number>([1, total, current]);
  for (let delta = -siblings; delta <= siblings; delta += 1) {
    const candidate = current + delta;
    if (candidate >= 1 && candidate <= total) {
      pages.add(candidate);
    }
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) {
      out.push('ellipsis');
    }
    out.push(page);
    previous = page;
  }
  return out;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/**
 * Accessible pagination: a `<nav aria-label>` with numbered links that
 * carry `aria-current="page"` on the active page and `aria-disabled`
 * on the prev/next edges.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  'aria-label': ariaLabel = 'Pagination',
  pageSize,
  pageSizes,
  onPageSizeChange,
  className,
  ...rest
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav aria-label={ariaLabel} className={cn(styles.root, className)} {...rest}>
      {pageSizes !== undefined && onPageSizeChange !== undefined && pageSize !== undefined && (
        <div className={styles.pageSize}>
          <label htmlFor="pagination-page-size" className={styles.pageSizeLabel}>
            Per page
          </label>
          <select
            id="pagination-page-size"
            value={pageSize}
            onChange={(event) => { onPageSizeChange(Number(event.target.value)); }}
            className={styles.pageSizeSelect}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.control}
            disabled={!canGoPrevious}
            aria-label="Previous page"
            onClick={() => { onPageChange(page - 1); }}
          >
            ‹
          </button>
        </li>
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === 'ellipsis' ? (
            <li key={`ellipsis-${index}`}>
              <span className={styles.ellipsis} aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={cn(styles.control, entry === page && styles.current)}
                aria-current={entry === page ? 'page' : undefined}
                onClick={() => { onPageChange(entry); }}
              >
                {entry}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={styles.control}
            disabled={!canGoNext}
            aria-label="Next page"
            onClick={() => { onPageChange(page + 1); }}
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
