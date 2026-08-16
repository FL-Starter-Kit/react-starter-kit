import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

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
