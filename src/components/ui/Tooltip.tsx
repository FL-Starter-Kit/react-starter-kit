import { cloneElement, isValidElement, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** A single focusable trigger element (e.g. <button>). */
  children: ReactNode;
  /** Tooltip content, announced as the trigger's accessible description. */
  label: ReactNode;
  /** Allow the pointer to move onto the tooltip without closing it. */
  hoverable?: boolean;
}

/**
 * Tooltip shown on hover and keyboard focus.
 *
 * The trigger element receives `aria-describedby`, so the tooltip content
 * is available to screen readers without any hover interaction. The
 * tooltip itself is decorative and non-interactive (use `hoverable` only
 * when the content needs interaction).
 */
export function Tooltip({ children, label, hoverable = false }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
    }
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
    }
    openTimer.current = setTimeout(() => { setOpen(true); }, 150);
  };

  const hide = () => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
    }
    closeTimer.current = setTimeout(() => { setOpen(false); }, hoverable ? 100 : 0);
  };

  if (!isValidElement<{ 'aria-describedby'?: string }>(children)) {
    throw new Error('Tooltip requires a single React element as its child.');
  }

  const trigger = cloneElement(children, {
    'aria-describedby': children.props['aria-describedby'] ? `${children.props['aria-describedby']} ${id}` : id,
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
      <span
        id={id}
        role="tooltip"
        className={cn(styles.tooltip, open && styles.visible)}
        onMouseEnter={hoverable ? show : undefined}
        onMouseLeave={hoverable ? hide : undefined}
      >
        {label}
      </span>
    </span>
  );
}
