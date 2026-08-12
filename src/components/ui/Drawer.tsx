import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';

import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  /** Accessible description of the drawer purpose. */
  description?: ReactNode;
  /** Optional footer content (action buttons). */
  footer?: ReactNode;
  side?: 'left' | 'right';
}

/**
 * Side panel built on the native <dialog> element (modal, focus-trapped,
 * ESC-close, scroll locking). Same semantics as Dialog, different layout.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      previouslyFocused.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    const onCancel = (event: Event) => {
      event.preventDefault();
      onOpenChange(false);
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
    };
  }, [onOpenChange]);

  const drawer = (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      className={cn(styles.drawer, styles[side])}
      onClose={() => {
        onOpenChange(false);
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <IconButton
          aria-label="Close panel"
          variant="ghost"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          <span aria-hidden="true">✕</span>
        </IconButton>
      </div>
      {description !== undefined && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <div className={styles.body}>{children}</div>
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </dialog>
  );

  return createPortal(drawer, document.body);
}
