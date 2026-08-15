import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/utils/cn';

import styles from './Popover.module.css';

/** Wrapper that manages open state (uncontrolled via `defaultOpen`, or controlled via `open`/`onOpenChange`). Non-modal by default. */
export const Popover = PopoverPrimitive.Root;

/** The element the popover is anchored to (a `<button>` by default, or `asChild` for any element). */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Alternate anchor for cases where the visible trigger and the popover anchor differ. */
export const PopoverAnchor = PopoverPrimitive.Anchor;

/** A button inside the content that closes the popover. */
export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = PopoverPrimitive.PopoverContentProps;

/**
 * The popover panel. Portaled, collision-aware and viewport-bounded by Radix;
 * renders an arrow pointing at the anchor. Focus moves into the panel on open;
 * ESC and outside click close it.
 */
export function PopoverContent({
  className,
  showArrow = true,
  children,
  sideOffset = 8,
  ...props
}: PopoverContentProps & { showArrow?: boolean }) {
  return (
    <PopoverPrimitive.Content
      className={cn(styles.content, className)}
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {showArrow && <PopoverPrimitive.Arrow className={styles.arrow} />}
    </PopoverPrimitive.Content>
  );
}
