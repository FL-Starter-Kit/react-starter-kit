import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from '@/components/ui/Select';

describe('Select', () => {
  it('renders options and marks invalid selects', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select aria-label="Role" value="viewer" invalid onChange={onChange}>
        <option value="viewer">Viewer</option>
        <option value="admin">Admin</option>
      </Select>,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    await user.selectOptions(select, 'admin');
    expect(onChange).toHaveBeenCalled();
  });
});
