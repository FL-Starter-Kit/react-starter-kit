import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('marks invalid textareas with aria-invalid', () => {
    render(<Textarea invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
