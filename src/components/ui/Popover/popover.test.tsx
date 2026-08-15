import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

interface ExampleProps {
  triggerLabel?: string;
  content?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  showArrow?: boolean;
}

function ExamplePopover({
  triggerLabel = 'Open popover',
  content = 'Popover content',
  showArrow,
  ...rest
}: ExampleProps) {
  return (
    <Popover {...rest}>
      <PopoverTrigger>{triggerLabel}</PopoverTrigger>
      <PopoverContent {...(showArrow !== undefined && { showArrow })}>
        <p>{content}</p>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('opens on trigger click and closes on a second click', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is open by default when defaultOpen is set', () => {
    render(<ExamplePopover defaultOpen />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('supports controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ExamplePopover open onOpenChange={onOpenChange} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover />);

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open popover' })).toHaveFocus();
  });

  it('moves focus into the content when opened', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover />);

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toContainElement(document.activeElement as HTMLElement | null);
  });

  it('closes on outside pointer down', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover />);

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Radix registers the outside-pointerdown listener on the next tick and
    // defers dismissal of a primary pointerdown to the following click.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an arrow pointing at the anchor by default', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover />);

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByRole('dialog').querySelector('svg')).not.toBeNull();
  });

  it('omits the arrow when showArrow is false', async () => {
    const user = userEvent.setup();
    render(<ExamplePopover showArrow={false} />);

    await user.click(screen.getByRole('button', { name: 'Open popover' }));
    expect(screen.getByRole('dialog').querySelector('svg')).toBeNull();
  });
});
