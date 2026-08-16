import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Radio, RadioGroup } from '@/components/ui/Radio';

describe('Radio / RadioGroup', () => {
  it('groups radios in a fieldset with a legend', () => {
    render(
      <RadioGroup legend="Billing">
        <Radio label="Monthly" defaultChecked />
        <Radio label="Annual" />
      </RadioGroup>,
    );
    const group = screen.getByRole('group', { name: 'Billing' });
    const radios = screen.getAllByRole('radio');
    expect(group).toBeInTheDocument();
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();
  });

  it('labels each radio with its label text', () => {
    render(
      <RadioGroup legend="Plan">
        <Radio label="Monthly" />
        <Radio label="Annual" hint="Save 20%" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: /Monthly/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Annual/ })).toBeInTheDocument();
  });

  it('marks invalid radios', () => {
    render(
      <RadioGroup legend="Plan">
        <Radio label="Monthly" invalid />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true');
  });
});
