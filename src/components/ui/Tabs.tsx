import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends ComponentPropsWithoutRef<'div'> {
  items: readonly TabItem[];
  /** Controlled active tab id. */
  activeTabId: string;
  onActiveTabChange: (tabId: string) => void;
  /** Accessible name for the tablist (required when no visible heading). */
  'aria-label'?: string;
}

/**
 * Tabs with roving-tabindex keyboard navigation (← →, Home, End).
 * Follows the WAI-ARIA tabs pattern; panels are labelled by their tab.
 */
export function Tabs({ items, activeTabId, onActiveTabChange, className, 'aria-label': ariaLabel, ...rest }: TabsProps) {
  const baseId = useId();
  const activeTab = items.find((item) => item.id === activeTabId) ?? items.find((item) => !item.disabled);

  const focusTab = (index: number) => {
    const next = items[index];
    if (next && !next.disabled) {
      onActiveTabChange(next.id);
      document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
    }
  };

  const moveFocus = (direction: -1 | 1) => {
    const currentIndex = items.findIndex((item) => item.id === activeTabId);
    const start = currentIndex === -1 ? 0 : currentIndex;
    let index = start;
    let steps = 0;
    while (steps < items.length) {
      index = (index + direction + items.length) % items.length;
      steps += 1;
      const candidate = items[index];
      if (candidate && !candidate.disabled) {
        focusTab(index);
        return;
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(items.length - 1);
        break;
      default:
        break;
    }
  };

  const active = activeTab?.id;

  return (
    <div className={className} {...rest}>
      <div role="tablist" aria-label={ariaLabel} tabIndex={0} className={styles.tablist} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={cn(styles.tab, selected && styles.active)}
              onClick={() => { onActiveTabChange(item.id); }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${baseId}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          className={styles.panel}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
