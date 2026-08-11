import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';

function ControlledDialog({ open: initialOpen }: { open?: boolean }) {
  return (
    <Dialog open={initialOpen ?? true} onOpenChange={() => undefined} title="Confirm deletion">
      Delete this item?
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders nothing in the document when closed', () => {
    render(<ControlledDialog open={false} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toBeVisible();
    expect(dialog).toHaveProperty('open', false);
  });

  it('renders the dialog title and content when open', () => {
    render(
      <Dialog open onOpenChange={() => undefined} title="Confirm deletion" description="This cannot be undone">
        Delete this item?
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Confirm deletion' })).toBeVisible();
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) from the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Confirm deletion">
        Delete this item?
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders footer actions', () => {
    render(
      <Dialog
        open
        onOpenChange={() => undefined}
        title="Confirm"
        footer={<button type="button">Confirm</button>}
      >
        Body
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('omits the close button when showCloseButton is false', () => {
    render(
      <Dialog open onOpenChange={() => undefined} title="Confirm" showCloseButton={false}>
        Body
      </Dialog>,
    );
    expect(screen.queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
  });

  it('is open when the open prop is set', () => {
    render(<ControlledDialog />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveProperty('open', true);
  });
});

describe('Drawer', () => {
  it('renders the drawer when open with a labelled title', () => {
    render(
      <Drawer open onOpenChange={() => undefined} title="Filters" description="Refine the list">
        Filter content
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByText('Filter content')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} onOpenChange={() => undefined} title="Filters">
        Filter content
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toBeVisible();
    expect(dialog).toHaveProperty('open', false);
  });

  it('calls onOpenChange(false) from the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange} title="Filters">
        Content
      </Drawer>,
    );

    await user.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
