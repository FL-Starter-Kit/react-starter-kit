import type { ToastData, ToastInput, ToastOptions, ToastVariant } from './types';

/**
 * Module-level toast store backing the imperative `toast` API.
 *
 * The store is a tiny immutable snapshot + subscriber list consumed by the
 * mounted `<ToastProvider />` via `useSyncExternalStore`, so toasts can be
 * created from anywhere (event handlers, async flows, error boundaries) with
 * no context wiring. The provider subscribes on mount and renders whatever is
 * in the store, so calls before the provider mounts are still shown.
 */

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 5000,
  info: 5000,
  warning: 8000,
  error: 12000,
};

let toasts: ToastData[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function createId(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `toast-${random}`;
}

function normalizeOptions(input: ToastInput): ToastOptions {
  if (typeof input === 'string') {
    return { title: input };
  }
  return input;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot(): readonly ToastData[] {
  return toasts;
}

const EMPTY_TOASTS: readonly ToastData[] = [];

export function getToastsServerSnapshot(): readonly ToastData[] {
  return EMPTY_TOASTS;
}

export function addToast(variant: ToastVariant, input: ToastInput): string {
  const options = normalizeOptions(input);
  const id = createId();
  const toast: ToastData = {
    id,
    variant,
    status: 'active',
    title: options.title,
    duration: options.duration ?? DEFAULT_DURATION[variant],
    dismissible: options.dismissible ?? true,
    ...(options.description !== undefined && { description: options.description }),
    ...(options.action !== undefined && { action: options.action }),
    ...(options.onDismiss !== undefined && { onDismiss: options.onDismiss }),
  };
  toasts = [toast, ...toasts];
  emit();
  return id;
}

/** Mark a toast as leaving so it plays its exit animation before removal. */
export function dismissToast(id: string): void {
  let changed = false;
  toasts = toasts.map((toast) => {
    if (toast.id !== id || toast.status !== 'active') {
      return toast;
    }
    changed = true;
    return { ...toast, status: 'leaving' };
  });
  if (!changed) {
    return;
  }
  const dismissed = toasts.find((toast) => toast.id === id);
  dismissed?.onDismiss?.();
  emit();
}

export function dismissAllToasts(): void {
  let changed = false;
  toasts = toasts.map((toast) => {
    if (toast.status !== 'active') {
      return toast;
    }
    changed = true;
    return { ...toast, status: 'leaving' };
  });
  if (changed) {
    emit();
  }
}

/** Remove a toast outright (after its exit animation, or test cleanup). */
export function removeToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/** Drop every toast immediately without firing callbacks. Test/cleanup helper. */
export function clearToasts(): void {
  if (toasts.length === 0) {
    return;
  }
  toasts = [];
  emit();
}

export interface ToastApi {
  /** Show a success toast. Returns its id for programmatic dismissal. */
  success(input: ToastInput): string;
  /** Show an info toast. Returns its id for programmatic dismissal. */
  info(input: ToastInput): string;
  /** Show a warning toast. Returns its id for programmatic dismissal. */
  warning(input: ToastInput): string;
  /** Show an error toast. Returns its id for programmatic dismissal. */
  error(input: ToastInput): string;
  /** Dismiss a toast by id (plays the exit animation). */
  dismiss(id: string): void;
  /** Dismiss every active toast (plays the exit animation). */
  dismissAll(): void;
  /** Immediately drop all toasts without animation or callbacks. Primarily for tests. */
  clear(): void;
}

export const toast: ToastApi = {
  success: (input) => addToast('success', input),
  info: (input) => addToast('info', input),
  warning: (input) => addToast('warning', input),
  error: (input) => addToast('error', input),
  dismiss: (id) => {
    dismissToast(id);
  },
  dismissAll: () => {
    dismissAllToasts();
  },
  clear: () => {
    clearToasts();
  },
};
