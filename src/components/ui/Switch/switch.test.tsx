import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from '@/components/ui/Switch';

describe('Switch', () => {
  it('is a button with role=switch and aria-checked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Notifications" />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
