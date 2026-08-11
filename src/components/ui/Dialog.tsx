import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';

import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  /** Accessible description of the dialog purpose. */
  description?: ReactNode;
  /** Optional footer content (action buttons). */
  footer?: ReactNode;
  /** Show the close (X) button. Defaults to true. */
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Modal dialog built on the native <dialog> element: focus trapping, ESC
 * handling, focus restore, scroll locking and `aria-modal` come from the
 * platform. `open` is controlled from outside; announce changes there.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  size = 'md',
}: DialogProps) {
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
    return () => { dialog.removeEventListener('cancel', onCancel); };
  }, [onOpenChange]);

  const dialog = (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      className={cn(styles.dialog, styles[size])}
      onClose={() => { onOpenChange(false); }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {showCloseButton && (
          <IconButton aria-label="Close dialog" variant="ghost" onClick={() => { onOpenChange(false); }}>
            <span aria-hidden="true">✕</span>
          </IconButton>
        )}
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

  return createPortal(dialog, document.body);
}
