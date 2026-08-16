import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('marks invalid inputs with aria-invalid', () => {
    render(<Input invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('omits aria-invalid for valid inputs', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });
});
