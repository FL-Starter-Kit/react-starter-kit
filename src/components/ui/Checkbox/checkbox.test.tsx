import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '@/components/ui/Checkbox';

describe('Checkbox', () => {
  it('toggles and reports its checked state', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="accept-terms">Accept terms</label>
        <Checkbox id="accept-terms" defaultChecked />
      </>,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('marks invalid checkboxes', () => {
    render(<Checkbox aria-label="Accept" invalid />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
