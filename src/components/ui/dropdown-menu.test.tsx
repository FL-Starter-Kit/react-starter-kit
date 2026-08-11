import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenu } from '@/components/ui/DropdownMenu';

const items = [
  { label: 'Edit', onSelect: vi.fn() },
  { label: 'Duplicate', onSelect: vi.fn(), disabled: true },
  { label: 'Delete', onSelect: vi.fn(), destructive: true },
];

describe('DropdownMenu', () => {
  it('renders the trigger button closed by default', () => {
    render(<DropdownMenu triggerLabel="Actions" items={items} />);
    const trigger = screen.getByRole('button', { name: /Actions/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the menu on click and exposes it as a labelled menu', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu triggerLabel="Actions" items={items} menuLabel="Row actions" />);

    await user.click(screen.getByRole('button', { name: /Actions/ }));
    const menu = screen.getByRole('menu', { name: 'Row actions' });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('selects an item, calls its handler, and closes the menu', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<DropdownMenu triggerLabel="Actions" items={[{ label: 'Edit', onSelect: onEdit }]} />);

    await user.click(screen.getByRole('button', { name: /Actions/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not fire handlers for disabled items', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu triggerLabel="Actions" items={items} />);
    await user.click(screen.getByRole('button', { name: /Actions/ }));

    const duplicate = screen.getByRole('menuitem', { name: 'Duplicate' });
    expect(duplicate).toBeDisabled();
    await user.click(duplicate);
    expect(items[1]?.onSelect).not.toHaveBeenCalled();
  });

  it('navigates items with arrow keys and activates with Enter', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu triggerLabel="Actions" items={items} />);
    await user.click(screen.getByRole('button', { name: /Actions/ }));

    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    expect(edit).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(items[0]?.onSelect).toHaveBeenCalledTimes(1);
  });

  it('skips disabled items while navigating with arrows', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu triggerLabel="Actions" items={items} />);
    await user.click(screen.getByRole('button', { name: /Actions/ }));
    await user.keyboard('{ArrowDown}');

    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(deleteItem).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(items[2]?.onSelect).toHaveBeenCalledTimes(1);
    expect(items[1]?.onSelect).not.toHaveBeenCalled();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu triggerLabel="Actions" items={items} />);
    const trigger = screen.getByRole('button', { name: /Actions/ });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Outside</button>
        <DropdownMenu triggerLabel="Actions" items={items} />
      </>,
    );
    await user.click(screen.getByRole('button', { name: /Actions/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
