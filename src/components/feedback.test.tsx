import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

describe('Alert', () => {
  it('uses role=alert for danger variants', () => {
    render(<Alert variant="danger">Server exploded</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Server exploded');
  });

  it('uses role=status for non-danger variants', () => {
    const { rerender } = render(<Alert variant="info">Note</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Note');
    rerender(<Alert variant="success">Saved</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('renders the optional title', () => {
    render(<Alert variant="warning" title="Heads up">Details</Alert>);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('renders a dismiss button with a custom label and calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert variant="info" onDismiss={onDismiss} dismissLabel="Close notice">
        Note
      </Alert>,
    );
    await user.click(screen.getByRole('button', { name: 'Close notice' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('renders title, description, and action', () => {
    render(
      <EmptyState
        title="No users found"
        description="Try different filters."
        action={<button type="button">Create user</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No users found', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Try different filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument();
  });

  it('hides the illustration from assistive technology', () => {
    render(
      <EmptyState
        title="Empty"
        illustration={<span>🔍</span>}
      />,
    );
    expect(screen.getByText('🔍').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ErrorState', () => {
  it('is an alert with a safe default message', () => {
    render(<ErrorState />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('An unexpected error occurred. Please try again.');
  });

  it('renders custom title and description', () => {
    render(<ErrorState title="Could not load users" description="Check your connection." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load users');
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection.');
  });

  it('calls onRetry from the retry button', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders extra actions', () => {
    render(<ErrorState actions={<button type="button">Home</button>} />);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
