# Toast / Notification system

Application-wide notifications built on `@radix-ui/react-toast`, with a module-level imperative API
usable from anywhere:

```tsx
import { toast } from '@/components/feedback/toast';

toast.success('Saved');
toast.error({
  title: 'Request failed',
  description: 'Try again.',
  action: { label: 'Retry', onClick: retry },
});
```

Mount `<ToastProvider />` once near the app root (it is already wired up in
`src/app/bootstrap/bootstrap.tsx`).

- `src/components/feedback/toast/types.ts` — public types
- `src/components/feedback/toast/store.ts` — store + `toast` API
- `src/components/feedback/toast/ToastProvider.tsx` — app-wide provider
- `src/components/feedback/toast/ToastItem.tsx` — single toast rendering
- `src/components/feedback/toast/ToastIcon.tsx` — variant icons
- `src/components/feedback/toast/Toast.module.css` — styles
- `src/components/feedback/toast/toast.test.tsx` — tests

---

## 1. The store is a tiny event emitter

`store.ts` holds a module-level immutable array plus a subscriber set:

```ts
let toasts: ToastData[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}
```

`toast.success({...})` → `addToast('success', options)` resolves defaults (per-variant duration,
`dismissible`), prepends `{ id, variant, status: 'active', ... }`, then `emit()`. Every mutation
(`addToast`, `dismissToast`, `removeToast`, …) creates a new array; the old array is never mutated
in place.

## 2. The provider is subscribed via `useSyncExternalStore`

`ToastProvider.tsx` calls:

```ts
const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsServerSnapshot);
```

When `emit()` runs, React re-renders the provider with the new snapshot. It renders one `ToastItem`
per toast inside Radix's `Toast.Provider`, plus the `Toast.Viewport`:

```tsx
<RadixToast.Provider label={label} swipeDirection="right" {...}>
  {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />)}
  <RadixToast.Viewport className={cn(styles.viewport, styles[position])} />
</RadixToast.Provider>
```

Two important details:

- **The viewport must register first.** Radix stores the viewport element in provider state (set via
  a ref callback on the `<ol>`); until it is set, `Toast.Root` renders `null`. That is why a freshly
  created toast only appears after the provider's first commit.
- **Radix portals each toast `<li>` into that viewport**
  (`ReactDOM.createPortal(..., context.viewport)`), so the stack is rendered into the fixed-position
  container.

## 3. Each toast is a controlled Radix `Toast.Root`

`ToastItem.tsx`:

```tsx
<RadixToast.Root
  type={variant === 'error' ? 'foreground' : 'background'}
  open={toast.status === 'active'}
  duration={toast.duration}
  onOpenChange={(open) => {
    if (!open) dismissToast(id);
  }}
  onAnimationEnd={handleAnimationEnd}
>
  <RadixToast.Title className={styles.title}>{toast.title}</RadixToast.Title>
  {toast.description && (
    <RadixToast.Description className={styles.description}>
      {toast.description}
    </RadixToast.Description>
  )}
  {toast.action && (
    <RadixToast.Action altText={actionAltText(toast.action)} onClick={toast.action.onClick}>
      {toast.action.label}
    </RadixToast.Action>
  )}
  {toast.dismissible && (
    <RadixToast.Close className={styles.close} aria-label="Dismiss notification">
      ✕
    </RadixToast.Close>
  )}
</RadixToast.Root>
```

`status` in the store is the single source of truth; `open` is derived from it.

## 4. What Radix gives you for free

- **Auto-dismiss timer** — the `duration` prop drives a countdown that fires `onOpenChange(false)`.
- **Pause/resume** — the viewport dispatches custom `VIEWPORT_PAUSE` / `VIEWPORT_RESUME` events on
  pointer-move into / pointer-leave out of the stack, focus-in/out, and window blur/focus. Each
  toast adjusts its remaining time accordingly.
- **Live-region announcement** — `ToastAnnounce` renders `role="status"` with
  `aria-live="assertive"` for `type="foreground"` (errors) and `"polite"` for `"background"`
  (everything else), announcing `label + title + description` and excluding the buttons.
- **Dismissal paths** — Escape (via `DismissableLayer`), swipe-to-dismiss, and `ToastClose` /
  `ToastAction` (both call the shared `onClose`). If focus was inside the toast, it moves to the
  viewport first.
- **Focus management** — the viewport is `role="region"` with an accessible label, toasts are
  `tabIndex={0}`, and there are visually hidden focus proxies plus an F8 hotkey that focuses the
  viewport.

## 5. Dismissal is two-phase, so there is no leak

```
dismissToast(id)   // status: 'active' → 'leaving', fires onDismiss ONCE, emits
      ↓
re-render: open=false → Radix sets data-state="closed", CSS exit animation runs
      ↓
onAnimationEnd (data-state === 'closed') → removeToast(id)   // browser path
600ms setTimeout fallback → removeToast(id)                  // jsdom / no-CSS path
```

Why the fallback: jsdom never fires `animationend`, so removal would never happen in tests. Both
paths call `removeToast`, which filters the id out and emits — idempotent, so whichever fires first
wins and the other is a no-op. This guarantees the toast is always eventually removed from the
store.

## 6. Cleanup / no leaks

- Radix clears its internal timer on unmount.
- `onDismiss` is guarded to fire only on the `active → leaving` transition, so auto-dismiss, close
  button, swipe, Escape and the action button cannot double-call it.
- The store is a singleton; `toast.clear()` empties it synchronously so tests do not pollute each
  other.

## API

```ts
interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  duration?: number;      // ms; Infinity = sticky. Per-variant defaults otherwise.
  action?: ToastAction;   // { label, onClick, altText? }
  dismissible?: boolean;  // default true
  onDismiss?: () => void; // fires once when dismissed for any reason
}

type ToastInput = string | ToastOptions;

toast.success(input: ToastInput): string; // returns id for programmatic dismissal
toast.info(input: ToastInput): string;
toast.warning(input: ToastInput): string;
toast.error(input: ToastInput): string;
toast.dismiss(id: string): void;
toast.dismissAll(): void;
toast.clear(): void; // immediate, no animation/callbacks — tests
```
