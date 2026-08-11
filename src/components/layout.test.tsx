import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

describe('Container', () => {
  it('renders children with the size class', () => {
    const { rerender } = render(<Container>Content</Container>);
    expect(screen.getByText('Content')).toHaveClass('lg');
    rerender(<Container size="sm">Content</Container>);
    expect(screen.getByText('Content')).toHaveClass('sm');
  });
});

describe('PageHeader', () => {
  it('renders a single h1 with title, eyebrow and description', () => {
    render(<PageHeader eyebrow="Reference feature" title="Users" description="Manage users" />);
    expect(screen.getByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Reference feature')).toBeInTheDocument();
    expect(screen.getByText('Manage users')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(<PageHeader title="Users" actions={<button type="button">Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
