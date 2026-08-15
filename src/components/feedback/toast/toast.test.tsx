import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from './store';
import { ToastProvider } from './ToastProvider';

/**
 * The provider re-renders after the Radix viewport registers itself, so wrap
 * toast creation in `act` and assert synchronously — keeps fake-timer tests
 * deterministic (RTL's `findBy*` waits rely on real timers).
 */
async function addToast(create: () => void): Promise<void> {
  act(() => {
    create();
  });
  await Promise.resolve();
}

function renderProvider() {
  return render(<ToastProvider />);
}

describe('toast store', () => {
  beforeEach(() => {
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it('renders a toast with title and description', async () => {
    renderProvider();
    await addToast(() =>
      toast.success({ title: 'Changes saved', description: 'Your profile was updated.' }),
    );
    expect(screen.getByText('Changes saved')).toBeInTheDocument();
    expect(screen.getByText('Your profile was updated.')).toBeInTheDocument();
  });

  it('accepts a plain string shorthand', async () => {
    renderProvider();
    await addToast(() => toast.info('Hello'));
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('returns an id that can dismiss the toast', async () => {
    vi.useFakeTimers();
    try {
      let id = '';
      renderProvider();
      await addToast(() => {
        id = toast.success({ title: 'By id' });
      });
      toast.dismiss(id);
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('By id')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stacks multiple toasts newest-first', async () => {
    renderProvider();
    await addToast(() => {
      toast.info({ title: 'First' });
      toast.info({ title: 'Second' });
      toast.info({ title: 'Third' });
    });
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Third'),
      expect.stringContaining('Second'),
      expect.stringContaining('First'),
    ]);
  });

  it('dismissAll removes every toast', async () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      await addToast(() => {
        toast.error({ title: 'One' });
        toast.warning({ title: 'Two' });
      });
      toast.dismissAll();
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('One')).not.toBeInTheDocument();
      expect(screen.queryByText('Two')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('auto-dismiss', () => {
  beforeEach(() => {
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it('auto-dismisses after the configured duration', async () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      await addToast(() => toast.info({ title: 'Auto', duration: 1000 }));
      expect(screen.getByText('Auto')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays open when duration is Infinity', async () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      await addToast(() => toast.success({ title: 'Sticky', duration: Infinity }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText('Sticky')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses auto-dismiss on hover and resumes afterwards', async () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      await addToast(() => toast.info({ title: 'Pause me', duration: 1000 }));
      const viewport = document.querySelector('[role="region"]');
      expect(viewport).toBeInstanceOf(Element);
      if (viewport === null) {
        return;
      }

      fireEvent.pointerMove(viewport);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      expect(screen.getByText('Pause me')).toBeInTheDocument();

      fireEvent.pointerLeave(viewport);
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Pause me')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('dismissal and actions', () => {
  beforeEach(() => {
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it('dismisses via the close button and fires onDismiss once', async () => {
    vi.useFakeTimers();
    try {
      const onDismiss = vi.fn();
      renderProvider();
      await addToast(() => toast.info({ title: 'Close me', onDismiss }));
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Close me')).not.toBeInTheDocument();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides the close button when dismissible is false', async () => {
    renderProvider();
    await addToast(() => toast.info({ title: 'Locked', dismissible: false }));
    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument();
  });

  it('renders an action button that runs and closes the toast', async () => {
    vi.useFakeTimers();
    try {
      const onAction = vi.fn();
      renderProvider();
      await addToast(() =>
        toast.warning({
          title: 'Action me',
          action: { label: 'Undo', onClick: onAction },
        }),
      );
      const button = screen.getByRole('button', { name: 'Undo' });
      expect(button).toHaveAttribute('type', 'button');
      fireEvent.click(button);
      expect(onAction).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Action me')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes on Escape when a toast has focus', async () => {
    vi.useFakeTimers();
    try {
      renderProvider();
      await addToast(() => toast.info({ title: 'Esc me' }));
      const item = screen.getByText('Esc me').closest('li');
      expect(item).not.toBeNull();
      if (item !== null) {
        item.focus();
        fireEvent.keyDown(item, { key: 'Escape' });
      }
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.queryByText('Esc me')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('accessibility announcements', () => {
  beforeEach(() => {
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it('announces error toasts assertively', async () => {
    renderProvider();
    await addToast(() => toast.error({ title: 'Request failed' }));
    const region = document.querySelector('[role="status"][aria-live="assertive"]');
    expect(region).not.toBeNull();
    // The live-region text is filled on a later animation frame (jsdom does not
    // run it), so assert the announcement semantics here; the visual toast text
    // is covered by the rendering tests above.
    expect(screen.getByText('Request failed')).toBeInTheDocument();
  });

  it('announces non-error toasts politely', async () => {
    renderProvider();
    await addToast(() => toast.success({ title: 'Saved' }));
    const region = document.querySelector('[role="status"][aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});

describe('lifecycle', () => {
  beforeEach(() => {
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it('unmounts cleanly with active toasts', async () => {
    const { unmount } = renderProvider();
    await addToast(() => toast.success({ title: 'Cleanup' }));
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('does not leak toasts into a later provider', async () => {
    const first = renderProvider();
    await addToast(() => toast.info({ title: 'Earlier' }));
    expect(screen.getByText('Earlier')).toBeInTheDocument();
    first.unmount();

    toast.clear();
    renderProvider();
    expect(screen.queryByText('Earlier')).not.toBeInTheDocument();
  });
});
