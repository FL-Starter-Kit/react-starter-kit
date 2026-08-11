import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AccordionItem } from '@/components/ui/Accordion';

describe('AccordionItem', () => {
  it('renders a summary and collapsed content', () => {
    render(
      <AccordionItem summary="Frequently asked">
        Answer text
      </AccordionItem>,
    );
    expect(screen.getByText('Frequently asked')).toBeInTheDocument();
    expect(screen.getByText('Answer text')).not.toBeVisible();
  });

  it('expands and collapses on summary click', async () => {
    const user = userEvent.setup();
    render(
      <AccordionItem summary="Frequently asked">
        Answer text
      </AccordionItem>,
    );
    await user.click(screen.getByText('Frequently asked'));
    expect(screen.getByText('Answer text')).toBeInTheDocument();
  });

  it('respects the controlled open prop', () => {
    render(
      <AccordionItem summary="Details" open>
        Visible content
      </AccordionItem>,
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('reports toggle events for controlled usage', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <AccordionItem summary="Details" onToggle={onToggle}>
        Content
      </AccordionItem>,
    );
    await user.click(screen.getByText('Details'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
