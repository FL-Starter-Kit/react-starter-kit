import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { cn } from '@/utils/cn';

import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  /** Visible label. */
  label: string;
  /** Called with the menu closed; the trigger regains focus. */
  onSelect: () => void;
  disabled?: boolean;
  /** Destructive items are visually marked. */
  destructive?: boolean;
}

export interface DropdownMenuProps {
  /** Accessible name for the trigger button. */
  triggerLabel: string;
  items: readonly DropdownMenuItem[];
  /** Optional accessible label for the menu (read when opened). */
  menuLabel?: string;
}

/**
 * Accessible menu: trigger button (`aria-expanded`/`aria-haspopup`) plus a
 * `role="menu"` list with full arrow-key navigation (↑ ↓ Home End), and
 * ESC / outside-click close. See the WAI-ARIA menu-button pattern.
 */
export function DropdownMenu({ triggerLabel, items, menuLabel }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const enabledIndices = items.map((item, index) => ({ item, index })).filter((entry) => !entry.item.disabled);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = () => {
    setOpen(true);
    const firstEnabled = enabledIndices[0];
    setFocusedIndex(firstEnabled?.index ?? 0);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node) || triggerRef.current?.contains(event.target as Node)) {
        return;
      }
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const current = enabledIndices.find((entry) => entry.index === focusedIndex);
    if (current) {
      const element = menuRef.current?.querySelector(`[data-item-index="${current.index}"]`);
      (element as HTMLElement | null)?.focus();
    }
  }, [open, focusedIndex, enabledIndices]);

  const moveFocus = (delta: number) => {
    setFocusedIndex((current) => {
      if (enabledIndices.length === 0) {
        return current;
      }
      const position = enabledIndices.findIndex((entry) => entry.index === current);
      const next = enabledIndices[(position + delta + enabledIndices.length) % enabledIndices.length];
      return next?.index ?? current;
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(enabledIndices[0]?.index ?? 0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(enabledIndices[enabledIndices.length - 1]?.index ?? 0);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => { if (open) { close(); } else { openMenu(); } }}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        {triggerLabel}
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul id={menuId} ref={menuRef} role="menu" aria-label={menuLabel ?? triggerLabel} className={styles.menu} onKeyDown={onKeyDown}>
          {items.map((item, index) => (
            <li key={index} role="none">
              <button
                type="button"
                role="menuitem"
                data-item-index={index}
                disabled={item.disabled}
                className={cn(styles.item, item.destructive && styles.destructive)}
                onPointerEnter={() => { setFocusedIndex(index); }}
                onClick={() => {
                  item.onSelect();
                  close();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
