import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn, type DataTableProps } from '@/components/ui/DataTable';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

const USERS: readonly UserRow[] = [
  { id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'admin' },
  { id: 'u2', name: 'Alan', email: 'alan@example.com', role: 'editor' },
  { id: 'u3', name: 'Grace', email: 'grace@example.com', role: 'viewer' },
  { id: 'u4', name: 'Katherine', email: 'katherine@example.com', role: 'admin' },
  { id: 'u5', name: 'Linus', email: 'linus@example.com', role: 'editor' },
];

const COLUMNS: readonly DataTableColumn<UserRow>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
  { id: 'role', header: 'Role', accessorKey: 'role', sortable: true },
  { id: 'email', header: 'Email', accessorKey: 'email', sortable: true },
];

const PAGE_ROWS: readonly UserRow[] = [
  { id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'admin' },
  { id: 'u2', name: 'Alan', email: 'alan@example.com', role: 'editor' },
];

const bodyNames = (table: HTMLElement): string =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '')
    .join(' | ');

function Harness(props: Partial<DataTableProps<UserRow>>) {
  return <DataTable columns={COLUMNS} data={USERS} {...props} />;
}

describe('DataTable', () => {
  it('renders headers, rows, and caption', () => {
    render(<Harness caption="Users" />);
    const table = screen.getByRole('table', { name: 'Users' });
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'scope',
      'col',
    );
    expect(within(table).getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
  });

  it('sorts client-side on header click (asc, then desc, then clears)', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Harness onSortChange={onSortChange} />);

    const table = screen.getByRole('table');
    const nameHeader = within(table).getByRole('columnheader', { name: 'Name' });
    const sortButton = within(nameHeader).getByRole('button');

    await user.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith({ id: 'name', dir: 'asc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyNames(table)).toBe('Ada | Alan | Grace | Katherine | Linus');

    await user.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith({ id: 'name', dir: 'desc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(bodyNames(table)).toBe('Linus | Katherine | Grace | Alan | Ada');

    await user.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith(null);
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    expect(bodyNames(table)).toBe('Ada | Alan | Grace | Katherine | Linus');
  });

  it('is keyboard operable through the sort header', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Harness onSortChange={onSortChange} />);

    const table = screen.getByRole('table');
    const roleHeader = within(table).getByRole('columnheader', { name: 'Role' });
    const sortButton = within(roleHeader).getByRole('button');
    sortButton.focus();
    await user.keyboard('{Enter}');

    expect(onSortChange).toHaveBeenCalledWith({ id: 'role', dir: 'asc' });
  });

  it('paginates client-side and reports page changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Harness pagination pageSize={2} onPageChange={onPageChange} />);

    expect(bodyNames(screen.getByRole('table'))).toBe('Ada | Alan');
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(bodyNames(screen.getByRole('table'))).toBe('Grace | Katherine');
    expect(screen.getByRole('button', { name: '2', current: 'page' })).toBeInTheDocument();
  });

  it('supports server-side pagination via totalPages without client slicing', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={PAGE_ROWS}
        pagination
        page={1}
        pageSize={2}
        totalPages={3}
      />,
    );
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('selects rows with a tri-state header checkbox and a bulk action bar', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    render(
      <Harness
        enableRowSelection
        onSelectedRowIdsChange={onSelectedRowIdsChange}
        bulkActions={(rows) => <button type="button">Archive {rows.length}</button>}
      />,
    );

    const header = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(header).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select u1' }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(['u1']);
    expect(header).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
    expect(screen.getByRole('button', { name: 'Archive 1' })).toBeInTheDocument();

    await user.click(header);
    expect(onSelectedRowIdsChange).toHaveBeenLastCalledWith(['u1', 'u2', 'u3', 'u4', 'u5']);
    expect(header).toBeChecked();
    expect(screen.getByRole('button', { name: 'Archive 5' })).toBeInTheDocument();
  });

  it('selects only the visible page when paginated', async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();
    render(
      <Harness
        pagination
        pageSize={2}
        enableRowSelection
        onSelectedRowIdsChange={onSelectedRowIdsChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(['u1', 'u2']);
  });

  it('toggles column visibility through the Columns menu', async () => {
    const user = userEvent.setup();
    const onColumnVisibilityChange = vi.fn();
    render(<Harness onColumnVisibilityChange={onColumnVisibilityChange} />);

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    const emailToggle = screen.getByRole('checkbox', { name: 'Email' });
    expect(emailToggle).toBeChecked();
    await user.click(emailToggle);

    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ name: true, role: true, email: false });
    expect(screen.queryByRole('columnheader', { name: 'Email' })).not.toBeInTheDocument();
  });

  it('does not offer non-hideable columns in the menu', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[
          { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
          { id: 'email', header: 'Email', accessorKey: 'email', hideable: false },
        ]}
        data={USERS}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByRole('checkbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Email' })).not.toBeInTheDocument();
  });

  it('shows a loading skeleton and announces it', () => {
    render(<Harness loading loadingLabel="Loading users…" />);
    expect(screen.getByRole('status', { name: 'Loading users…' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
  });

  it('shows an error state with a retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Harness error="Failed to load records." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load records.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows an empty state when there are no rows', () => {
    render(
      <Harness data={[]} emptyTitle="No users found" emptyDescription="Create your first user." />,
    );
    expect(screen.getByRole('heading', { name: 'No users found' })).toBeInTheDocument();
    expect(screen.getByText('Create your first user.')).toBeInTheDocument();
  });

  it('does not render pagination when disabled', () => {
    render(<Harness />);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('reads initial state from URL params', () => {
    const params = new URLSearchParams('page=2&pageSize=2&sort=name:desc&col=email');
    render(<Harness pagination params={params} onParamsChange={() => undefined} />);

    const table = screen.getByRole('table');
    expect(bodyNames(table)).toBe('Grace | Alan');
    expect(screen.queryByRole('columnheader', { name: 'Email' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2', current: 'page' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('writes state changes back to URL params, preserving unrelated params', async () => {
    const user = userEvent.setup();
    const params = new URLSearchParams('search=al');
    const onParamsChange = vi.fn<(next: URLSearchParams) => void>();
    render(<Harness pagination pageSize={2} params={params} onParamsChange={onParamsChange} />);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    const afterPage = onParamsChange.mock.calls[0]?.[0];
    expect(afterPage).toBeDefined();
    expect(afterPage?.get('page')).toBe('2');
    expect(afterPage?.get('search')).toBe('al');

    const nameHeader = within(screen.getByRole('table')).getByRole('columnheader', {
      name: 'Name',
    });
    await user.click(within(nameHeader).getByRole('button'));
    const afterSort = onParamsChange.mock.calls[1]?.[0];
    expect(afterSort?.get('sort')).toBe('name:asc');
    expect(afterSort?.get('page')).toBe('2');
    expect(afterSort?.get('search')).toBe('al');
  });

  it('supports custom renderers, getRowId and rowLabel', () => {
    render(
      <DataTable
        columns={[{ id: 'name', header: 'Name', render: (row) => <strong>{row.name}</strong> }]}
        data={USERS}
        getRowId={(row) => row.email}
        rowLabel={(row) => row.name}
        enableRowSelection
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Ada' })).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });
});
