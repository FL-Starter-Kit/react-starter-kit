import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

describe('Button', () => {
  it('renders its label and responds to clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a submit button when type=submit', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('disables and shows a loading state when loading', () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Save')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('applies the disabled attribute when disabled', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('combines custom classes with variant classes', () => {
    render(
      <Button className="custom" variant="danger">
        Save
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('custom');
    expect(screen.getByRole('button')).toHaveClass('danger');
  });
});

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
