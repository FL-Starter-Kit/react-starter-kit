import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from '@/components/ui/Label';

describe('Label', () => {
  it('renders a label and hides it visually when requested', () => {
    const { rerender } = render(<Label htmlFor="x">Name</Label>);
    expect(screen.getByText('Name')).not.toHaveClass('visually-hidden');
    rerender(
      <Label htmlFor="x" hideVisually>
        Name
      </Label>,
    );
    expect(screen.getByText('Name')).toHaveClass('visually-hidden');
  });
});
