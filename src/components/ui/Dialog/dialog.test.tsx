import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog, type DialogProps } from '@/components/ui/Dialog';

type HarnessProps = Omit<DialogProps, 'open' | 'onOpenChange'> & {
  open?: boolean;
  onOpenChange?: DialogProps['onOpenChange'];
};

function Harness({ open: initialOpen = true, onOpenChange, ...rest }: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return <Dialog open={open} onOpenChange={onOpenChange ?? setOpen} {...rest} />;
}

const resolveAction: () => Promise<void> = () => Promise.resolve();

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Harness open={false} title="Delete user" onConfirm={resolveAction} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders the title, description and actions when open', () => {
    render(
      <Harness
        title="Delete user"
        description="This permanently removes the account."
        onConfirm={resolveAction}
      />,
    );
    expect(screen.getByRole('alertdialog', { name: 'Delete user' })).toBeInTheDocument();
    expect(screen.getByText('This permanently removes the account.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('supports custom labels', () => {
    render(
      <Harness
        title="Leave organization"
        cancelLabel="Stay"
        confirmLabel="Leave"
        onConfirm={resolveAction}
      />,
    );
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  it('calls onOpenChange(false) from the cancel button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={resolveAction} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={resolveAction} onOpenChange={onOpenChange} />);

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking outside', () => {
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={resolveAction} onOpenChange={onOpenChange} />);

    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('traps focus inside the dialog and restores it on close', async () => {
    const user = userEvent.setup();
    function FocusHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
            }}
          >
            Delete
          </button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Delete user"
            onConfirm={resolveAction}
          />
        </>
      );
    }
    render(<FocusHarness />);

    const trigger = screen.getByRole('button', { name: 'Delete' });
    await user.click(trigger);

    expect(screen.getByRole('alertdialog')).toContainElement(
      document.activeElement as HTMLElement | null,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Radix restores focus to the previously focused element in a setTimeout.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(trigger).toHaveFocus();
  });

  it('disables both buttons and prevents double submit while confirming, then closes', async () => {
    const user = userEvent.setup();
    let resolveConfirm: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={onConfirm} onOpenChange={onOpenChange} />);

    const confirm = screen.getByRole('button', { name: 'Confirm' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    act(() => {
      resolveConfirm?.();
    });
    await Promise.resolve();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes after a synchronous onConfirm resolves', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => undefined);
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={onConfirm} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the error and stays open when onConfirm rejects', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => Promise.reject(new Error('Network failure')));
    const onOpenChange = vi.fn();
    render(<Harness title="Delete user" onConfirm={onConfirm} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network failure');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('falls back to a generic message for non-Error rejections', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => Promise.reject(new Error('')));
    render(<Harness title="Delete user" onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
  });

  it('hides the close button by default', () => {
    render(<Harness title="Delete user" onConfirm={resolveAction} />);
    expect(screen.queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
  });

  it('renders a close button and closes when showCloseButton is set', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Harness
        title="Example dialog"
        onConfirm={resolveAction}
        onOpenChange={onOpenChange}
        showCloseButton
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders custom footer content instead of the built-in buttons', () => {
    render(
      <Harness
        title="Create user"
        onConfirm={resolveAction}
        footer={<button type="button">Save</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('renders a single Close button when neither footer nor onConfirm is set', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness title="Information" onOpenChange={onOpenChange} />);

    expect(screen.getByRole('dialog', { name: 'Information' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('defaults to the generic role (dialog) when onConfirm is not set', () => {
    render(<Harness title="Information" />);
    expect(screen.getByRole('dialog', { name: 'Information' })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('closes on outside click in generic mode', async () => {
    const onOpenChange = vi.fn();
    render(<Harness title="Information" onOpenChange={onOpenChange} />);

    // Radix registers the outside-pointerdown listener on the next tick and
    // defers dismissal of a primary pointerdown to the following click.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('explicit variant="confirm" without onConfirm renders an alertdialog with a Close button', () => {
    render(<Harness title="Session expired" variant="confirm" />);

    expect(screen.getByRole('alertdialog', { name: 'Session expired' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('explicit variant="generic" overrides the confirm default when onConfirm is set', () => {
    render(<Harness title="Info dialog" variant="generic" onConfirm={resolveAction} />);

    expect(screen.getByRole('dialog', { name: 'Info dialog' })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('applies the requested size class', () => {
    render(<Harness title="Large dialog" onConfirm={resolveAction} size="lg" />);
    expect(screen.getByRole('alertdialog')).toHaveClass('lg');
  });

  it('resets the submitting state when reopened after closing mid-submit', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => new Promise<void>(() => undefined));
    function ReopenHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
            }}
          >
            Open
          </button>
          <Dialog open={open} onOpenChange={setOpen} title="Delete user" onConfirm={onConfirm} />
        </>
      );
    }
    render(<ReopenHarness />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirm);
    expect(confirm).toBeDisabled();

    // Close the dialog while the action is still pending, then reopen it.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const reopenedConfirm = screen.getByRole('button', { name: 'Confirm' });
    expect(reopenedConfirm).toBeEnabled();
  });
});
