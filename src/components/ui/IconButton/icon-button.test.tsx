import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from '@/components/ui/IconButton';

describe('IconButton', () => {
  it('requires and applies an aria-label', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Delete row" onClick={onClick}>
        ×
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Delete row' });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides decorative content from assistive technology', () => {
    render(<IconButton aria-label="Close">✕</IconButton>);
    expect(screen.getByRole('button')).toHaveTextContent('✕');
  });

  it('disables while loading', () => {
    render(
      <IconButton aria-label="Refresh" loading>
        ↻
      </IconButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
