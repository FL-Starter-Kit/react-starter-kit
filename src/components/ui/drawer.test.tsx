import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from '@/components/ui/Drawer';

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
