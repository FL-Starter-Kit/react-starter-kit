import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

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

describe('Textarea', () => {
  it('marks invalid textareas with aria-invalid', () => {
    render(<Textarea invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});

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

describe('Switch', () => {
  it('is a button with role=switch and aria-checked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Notifications" />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

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

describe('FormField', () => {
  it('associates label, control, and hint via ids', () => {
    render(
      <FormField name="email" label="Email" hint="Work email only">
        {(fieldId, describedById) => <Input id={fieldId} aria-describedby={describedById} />}
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(input.getAttribute('aria-describedby')).toBe(input.getAttribute('id') + '-hint');
    expect(screen.getByText('Work email only')).toBeInTheDocument();
  });

  it('renders the error with role=alert and links it to the control', () => {
    render(
      <FormField name="email" label="Email" error="Enter a valid email">
        {(fieldId, describedById) => (
          <Input id={fieldId} aria-describedby={describedById} invalid />
        )}
      </FormField>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Enter a valid email');
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toBe(alert.getAttribute('id'));
  });

  it('hides the hint when an error is present', () => {
    render(
      <FormField name="email" label="Email" hint="Work email" error="Bad email">
        {(fieldId) => <Input id={fieldId} />}
      </FormField>,
    );
    expect(screen.queryByText('Work email')).not.toBeInTheDocument();
  });

  it('marks required fields with a visual asterisk', () => {
    render(
      <FormField name="email" label="Email" required>
        {(fieldId) => <Input id={fieldId} />}
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('visually hides the label when hideLabel is set', () => {
    render(
      <FormField name="email" label="Email" hideLabel>
        {(fieldId) => <Input id={fieldId} />}
      </FormField>,
    );
    expect(screen.getByText('Email')).toHaveClass('visually-hidden');
  });
});
