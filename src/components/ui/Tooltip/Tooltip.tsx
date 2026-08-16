import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/utils/cn';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** A single focusable trigger element (e.g. <button>). */
  children: ReactNode;
  /** Tooltip content, announced as the trigger's accessible description. */
  label: ReactNode;
}

/**
 * Tooltip shown on hover and keyboard focus.
 *
 * Strictly non-interactive supplementary information: the trigger element
 * receives `aria-describedby` so the content is available to screen
 * readers without any hover interaction, and the tooltip itself is not a
 * pointer or keyboard target. If the content ever needs interaction or
 * rich markup, use a Popover-style component instead — a tooltip must not
 * become interactive.
 */
export function Tooltip({ children, label }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current !== null) {
        clearTimeout(openTimer.current);
      }
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const show = () => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
    }
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
    }
    openTimer.current = setTimeout(() => {
      setOpen(true);
    }, 150);
  };

  const hide = () => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
    }
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 0);
  };

  if (!isValidElement<{ 'aria-describedby'?: string }>(children)) {
    throw new Error('Tooltip requires a single React element as its child.');
  }

  const trigger = cloneElement(children, {
    'aria-describedby': children.props['aria-describedby']
      ? `${children.props['aria-describedby']} ${id}`
      : id,
  });

  return (
    <span
      className={styles.trigger}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {trigger}
      <span id={id} role="tooltip" className={cn(styles.tooltip, open && styles.visible)}>
        {label}
      </span>
    </span>
  );
}
