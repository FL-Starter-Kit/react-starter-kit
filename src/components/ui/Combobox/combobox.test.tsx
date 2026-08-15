import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption, type ComboboxProps } from '@/components/ui/Combobox';

const DEFAULT_OPTIONS: readonly ComboboxOption[] = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'alan', label: 'Alan Turing' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'katherine', label: 'Katherine Johnson', disabled: true },
];

interface HarnessProps {
  value?: string[];
  options?: ComboboxProps['options'];
  onValueChange?: (value: readonly string[]) => void;
}

function Harness({
  value: initialValue = [],
  options = DEFAULT_OPTIONS,
  onValueChange,
  ...props
}: HarnessProps & Omit<Partial<ComboboxProps>, 'value' | 'options' | 'onValueChange'>) {
  const [value, setValue] = useState<string[]>(initialValue);
  return (
    <Combobox
      label="Select user"
      options={options}
      value={value}
      onValueChange={
        onValueChange ??
        ((next) => {
          setValue([...next]);
        })
      }
      {...props}
    />
  );
}

const activeOptionId = (input: HTMLElement): string | null =>
  input.getAttribute('aria-activedescendant');

describe('Combobox', () => {
  it('is closed by default and opens on focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('filters options while typing', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'al');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Alan Turing');
  });

  it('navigates with the arrow keys and selects with Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith(['alan']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Alan Turing');
  });

  it('tracks the active option via aria-activedescendant', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');

    const id = input.getAttribute('aria-activedescendant');
    expect(id).not.toBeNull();
    const alan = screen.getByRole('option', { name: 'Alan Turing' });
    expect(alan).toHaveAttribute('id', id);
  });

  it('navigates to the first and last enabled option with Home and End', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    await user.keyboard('{End}');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Grace Hopper' }).id,
    );

    await user.keyboard('{Home}');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Ada Lovelace' }).id,
    );
  });

  it('skips disabled options while navigating and does not select them', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    expect(activeOptionId(input)).toBe(screen.getByRole('option', { name: 'Ada Lovelace' }).id);
  });

  it('does not select a disabled option on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Katherine Johnson' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('selects an option on click and closes the list', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Grace Hopper' }));

    expect(onValueChange).toHaveBeenCalledWith(['grace']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('toggles selections in multiple mode and keeps the list open', async () => {
    const user = userEvent.setup();
    render(<Harness multiple />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
    await user.click(screen.getByRole('option', { name: 'Grace Hopper' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ada Lovelace' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Grace Hopper' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }));
    expect(screen.queryByRole('button', { name: 'Remove Ada Lovelace' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeInTheDocument();
  });

  it('clears the selection with the clear button', async () => {
    const user = userEvent.setup();
    render(<Harness clearable value={['ada']} />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('Ada Lovelace');

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('shows a custom empty message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness emptyText="Nothing found" />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'zzz');

    expect(screen.getByRole('status')).toHaveTextContent('Nothing found');
  });

  it('closes on Escape and reverts the query to the selection', async () => {
    const user = userEvent.setup();
    render(<Harness value={['ada']} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'xyz');
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('Ada Lovelace');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on an outside pointer down', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('exposes an external validation error', () => {
    render(<Harness error="Required" />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('Required');
    expect(input).toHaveAttribute('aria-describedby', message.id);
  });

  it('is disabled when the disabled prop is set', async () => {
    const user = userEvent.setup();
    render(<Harness disabled value={['ada']} />);

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();

    await user.click(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('loads options asynchronously with loading, success, and re-query states', async () => {
    const user = userEvent.setup();
    const loader = vi.fn(async (query: string) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      return [{ value: 'result', label: `Result for "${query}"` }];
    });
    render(<Harness options={loader} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    await screen.findByText('Loading options…');
    expect(await screen.findByText('Result for ""')).toBeInTheDocument();
    expect(loader).toHaveBeenCalledWith('');

    await user.type(input, 'ne');
    await screen.findByText('Loading options…');
    expect(await screen.findByText('Result for "ne"')).toBeInTheDocument();
    expect(loader).toHaveBeenLastCalledWith('ne');
  });

  it('shows the loader error message when the async loader rejects', async () => {
    const user = userEvent.setup();
    const loader = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      throw new Error('Server exploded');
    });
    render(<Harness options={loader} />);

    await user.click(screen.getByRole('combobox'));
    const message = await screen.findByRole('alert');
    expect(message).toHaveTextContent('Server exploded');
  });

  it('debounces rapid typing so only the latest query is loaded', async () => {
    const user = userEvent.setup();
    const loader = vi.fn(async (query: string) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      return [{ value: 'result', label: `Result for "${query}"` }];
    });
    render(<Harness options={loader} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'ne');
    await user.type(input, 'r');

    expect(await screen.findByText('Result for "ner"')).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith('ner');
  });
});
