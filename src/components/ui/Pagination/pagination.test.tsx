import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders a labelled navigation with page buttons', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} aria-label="Users pages" />);
    expect(screen.getByRole('navigation', { name: 'Users pages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('disables prev on the first page and next on the last', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('calls onPageChange with the clicked page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('navigates with the next button', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders ellipses for large page counts', () => {
    render(<Pagination page={10} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('renders a page-size selector when configured', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        page={1}
        totalPages={3}
        pageSize={10}
        pageSizes={[10, 25, 50]}
        onPageSizeChange={onPageSizeChange}
        onPageChange={vi.fn()}
      />,
    );
    await user.selectOptions(screen.getByRole('combobox'), '25');
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
