import type { ReactNode } from 'react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  /** Visible label for the action button. */
  label: ReactNode;
  /** Runs when the action is activated; the toast closes afterwards. */
  onClick: () => void;
  /** Screen-reader description of the action. Defaults to `label` when it is a string. */
  altText?: string;
}

export interface ToastOptions {
  /** Primary message. */
  title: ReactNode;
  /** Secondary detail line. */
  description?: ReactNode;
  /**
   * Auto-dismiss delay in milliseconds. `Infinity` keeps the toast open until
   * dismissed by the user or by code. Defaults per variant.
   */
  duration?: number;
  /** Optional action button rendered alongside the message. */
  action?: ToastAction;
  /** Show the dismiss button. Defaults to `true`. */
  dismissible?: boolean;
  /** Called exactly once when the toast is dismissed (auto, manual, action, swipe). */
  onDismiss?: () => void;
}

/** Accepted argument shape for the imperative `toast.*` methods. */
export type ToastInput = string | ToastOptions;

export type ToastStatus = 'active' | 'leaving';

/** A resolved toast held by the store and rendered by the provider. */
export interface ToastData {
  id: string;
  variant: ToastVariant;
  status: ToastStatus;
  title: ReactNode;
  description?: ReactNode;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  onDismiss?: () => void;
}
