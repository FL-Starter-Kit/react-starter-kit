import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';

import styles from './Dialog.module.css';

export type DialogVariant = 'confirm' | 'generic';

export interface DialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog requests to close (Cancel, Close, ESC, successful confirm, outside click in generic mode). */
  onOpenChange: (open: boolean) => void;
  /** Title of the dialog. */
  title: ReactNode;
  /** Accessible description of the content or consequence. Recommended. */
  description?: ReactNode;
  /** Optional body content rendered above the footer. */
  children?: ReactNode;
  /**
   * Role semantics. `'confirm'` renders `role="alertdialog"` (forces an explicit
   * decision, no outside-click dismissal); `'generic'` renders `role="dialog"`.
   * Defaults to `'confirm'` when `onConfirm` is provided, otherwise `'generic'`.
   */
  variant?: DialogVariant;
  /** Show a close (✕) button in the header. Defaults to false. */
  showCloseButton?: boolean;
  /** Custom footer content. When provided it replaces the built-in buttons. */
  footer?: ReactNode;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the close button when neither `footer` nor `onConfirm` is set. Defaults to "Close". */
  closeLabel?: string;
  /** Text announced by the loading spinner on the confirm button. Defaults to "Submitting". */
  loadingLabel?: string;
  /**
   * Async action run when confirmed. When set (and no `footer`), the built-in
   * confirm/cancel buttons render: a rejection keeps the dialog open and
   * surfaces the error inline; success closes the dialog.
   */
  onConfirm?: () => void | Promise<void>;
  /** Dialog width. Defaults to 'sm' (confirmations are compact). */
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

/**
 * The single modal primitive: a confirmation dialog (Radix AlertDialog,
 * `role="alertdialog"`) for destructive/irreversible actions, and a
 * general-purpose dialog (Radix Dialog, `role="dialog"`) for everything else.
 * The confirm action is async: while it runs both buttons are disabled, and a
 * rejection keeps the dialog open with an inline error instead of silently
 * closing. The former native-`<dialog>` `Dialog` and `ConfirmDialog` were
 * merged into this component.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant,
  showCloseButton = false,
  footer,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  closeLabel = 'Close',
  loadingLabel = 'Submitting',
  onConfirm,
  size = 'sm',
}: DialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ReactNode>(undefined);
  const submittingRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const isConfirm = (variant ?? (onConfirm !== undefined ? 'confirm' : 'generic')) === 'confirm';

  // Reset transient state whenever the dialog opens (React's "adjust state
  // during render" pattern — keeps success/error state from leaking between
  // openings without a cascading effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSubmitting(false);
      setError(undefined);
    }
  }

  // The submit guard must also be released on reopen (it is only cleared in
  // handleConfirm when the async action settles, which never happens if the
  // dialog was closed mid-submit).
  useEffect(() => {
    if (open) {
      submittingRef.current = false;
    }
  }, [open]);

  const handleConfirm = async (): Promise<void> => {
    if (onConfirm === undefined) {
      return;
    }
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(undefined);
    try {
      await onConfirm();
      submittingRef.current = false;
      setSubmitting(false);
      onOpenChange(false);
    } catch (cause) {
      submittingRef.current = false;
      setSubmitting(false);
      setError(cause instanceof Error && cause.message !== '' ? cause.message : DEFAULT_ERROR);
    }
  };

  const contentProps = {
    className: cn(styles.content, styles[size]),
    onOpenAutoFocus: () => {
      // Radix restores focus to its own Trigger on close; without one,
      // capture the previously focused element so we can restore it.
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      previouslyFocusedRef.current?.focus();
    },
  };

  const renderContent = (titleNode: ReactNode, descriptionNode: ReactNode, actions: ReactNode) => (
    <>
      <div className={styles.header}>
        <div>{titleNode}</div>
        {showCloseButton && (
          <IconButton
            aria-label="Close dialog"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            <span aria-hidden="true">✕</span>
          </IconButton>
        )}
      </div>
      {description !== undefined && descriptionNode}
      <div className={styles.body}>
        {children}
        {error !== undefined && (
          <Alert variant="danger" className={styles.error}>
            {error}
          </Alert>
        )}
      </div>
      <div className={styles.footer}>{footer !== undefined ? footer : actions}</div>
    </>
  );

  if (isConfirm) {
    return (
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={styles.overlay} />
          <AlertDialog.Content {...contentProps}>
            {renderContent(
              <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>,
              description !== undefined && (
                <AlertDialog.Description className={styles.description}>
                  {description}
                </AlertDialog.Description>
              ),
              onConfirm !== undefined ? (
                <>
                  <AlertDialog.Cancel asChild>
                    <Button variant="secondary" disabled={submitting}>
                      {cancelLabel}
                    </Button>
                  </AlertDialog.Cancel>
                  <Button
                    variant="danger"
                    loading={submitting}
                    loadingLabel={loadingLabel}
                    onClick={() => {
                      void handleConfirm();
                    }}
                  >
                    {confirmLabel}
                  </Button>
                </>
              ) : (
                <AlertDialog.Cancel asChild>
                  <Button variant="secondary">{closeLabel}</Button>
                </AlertDialog.Cancel>
              ),
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content {...contentProps}>
          {renderContent(
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>,
            description !== undefined && (
              <RadixDialog.Description className={styles.description}>
                {description}
              </RadixDialog.Description>
            ),
            <RadixDialog.Close asChild>
              <Button variant="secondary">{closeLabel}</Button>
            </RadixDialog.Close>,
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
