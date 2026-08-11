import { useMatches } from 'react-router';

import type { BreadcrumbItem } from '@/components/navigation/Breadcrumbs';

/**
 * Derive breadcrumbs from the matched route chain. Each route that wants
 * a crumb provides `handle: { crumb: string | ((params) => string) }`.
 */
export function useRouteBreadcrumbs(): readonly BreadcrumbItem[] {
  const matches = useMatches();
  const items: BreadcrumbItem[] = [];
  let path = '';

  for (const match of matches) {
    const crumb = (match.handle as { crumb?: unknown } | undefined)?.crumb;
    if (typeof crumb === 'string') {
      path = match.pathname;
      items.push({ label: crumb, to: path });
    }
  }

  return items;
}
