import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Tooltip } from '@/components/ui/Tooltip';

describe('Tooltip', () => {
  it('wires the label as an accessible description of the trigger', () => {
    render(
      <Tooltip label="Deletes the record forever">
        <button type="button">Delete</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Delete' });
    expect(trigger).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Deletes the record forever');
  });

  it('throws when the child is not a single element', () => {
    expect(() => render(<Tooltip label="x">text</Tooltip>)).toThrow(/single React element/);
  });

  it('shows the tooltip on hover after the delay', async () => {
    vi.useFakeTimers();
    render(
      <Tooltip label="More info">
        <button type="button">Info</button>
      </Tooltip>,
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveClass('visible');

    const wrapper = tooltip.parentElement;
    expect(wrapper).not.toBeNull();
    // React synthesizes onMouseEnter from mouseover/mouseout, so a raw
    // `mouseenter` event would not reach the handler.
    fireEvent.mouseOver(wrapper as Element);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(tooltip).toHaveClass('visible');

    fireEvent.mouseOut(wrapper as Element);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(tooltip).not.toHaveClass('visible');
  });

  it('preserves an existing aria-describedby on the trigger', () => {
    render(
      <Tooltip label="Extra hint">
        <button type="button" aria-describedby="other-hint">
          Save
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Save' });
    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toContain('other-hint');
    expect(describedBy).toMatch(/\S+/);
  });
});
