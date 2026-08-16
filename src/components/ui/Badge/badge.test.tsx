import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders its children with the variant class', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toHaveClass('success');
  });

  it('defaults to neutral', () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText('Neutral')).toHaveClass('neutral');
  });
});
