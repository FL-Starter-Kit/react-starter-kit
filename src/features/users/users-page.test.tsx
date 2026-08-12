import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { scenario } from '@/tests/mocks/scenario';
import { renderApp } from '@/tests/renderApp';

/**
 * Integration tests for the Users feature — the full app (theme, query,
 * auth, router) against the MSW mock backend, seeded with 25 users.
 */
describe('UsersPage integration', () => {
  // The header renders the signed-in user's name, so text assertions
  // about list rows must be scoped to the table.
  const table = () => screen.getByRole('table');
  const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

  describe('list', () => {
    it('renders the first page of users with pagination', async () => {
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

      expect(await screen.findByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
      expect(await screen.findByText('10 users')).toBeInTheDocument();
      expect(within(table()).getByText('Ada Lovelace')).toBeInTheDocument();
      expect(within(table()).getByText('Alan Turing')).toBeInTheDocument();

      const pager = screen.getByRole('navigation', { name: 'Pagination' });
      expect(within(pager).getByRole('button', { name: 'Previous page' })).toBeDisabled();
      expect(within(pager).getByRole('button', { name: 'Next page' })).toBeEnabled();
    });

    it('paginates through all 25 seeded users', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.click(screen.getByRole('button', { name: '2' }));
      expect(await within(table()).findByText('Katherine Johnson')).toBeInTheDocument();
      expect(within(table()).queryByText('Ada Lovelace')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(await screen.findByText('5 users')).toBeInTheDocument();
      expect(within(table()).getByText('Sophie Wilson')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('switches the page size to show every user on one page', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.selectOptions(screen.getByLabelText('Per page'), '50');
      expect(await screen.findByText('25 users')).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });

    it('shows a loading skeleton while the list request is in flight', async () => {
      scenario.users.listDelayMs = 400;
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

      expect(await screen.findByRole('status', { name: 'Loading users' })).toBeInTheDocument();
      const table = await screen.findByRole('table', undefined, { timeout: 3000 });
      expect(await within(table).findByText('Ada Lovelace')).toBeInTheDocument();
    });

    it('shows the error state with a working retry', async () => {
      const user = userEvent.setup();
      // Sticky until reset — the HTTP client retries 5xx, so a one-shot
      // failure would be retried into success and no error would surface.
      scenario.users.failListWith = 500;
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

      expect(
        await screen.findByRole('heading', { name: 'Could not load users' }, { timeout: 5000 }),
      ).toBeInTheDocument();

      scenario.users.failListWith = undefined;
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await within(table()).findByText('Ada Lovelace')).toBeInTheDocument();
    });
  });

  describe('search and filters', () => {
    it('filters by search term (debounced)', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.type(screen.getByLabelText('Search users'), 'ada');
      expect(await screen.findByText('1 user')).toBeInTheDocument();
      expect(within(table()).getByText('Ada Lovelace')).toBeInTheDocument();
      expect(within(table()).queryByText('Alan Turing')).not.toBeInTheDocument();

      await user.clear(screen.getByLabelText('Search users'));
      expect(await screen.findByText('10 users')).toBeInTheDocument();
    });

    it('shows the empty state when nothing matches', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.type(screen.getByLabelText('Search users'), 'zzzz-nothing');
      expect(await screen.findByText('No users found')).toBeInTheDocument();
    });

    it('filters by role', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.selectOptions(screen.getByLabelText('Filter by role'), 'admin');
      expect(await screen.findByText('5 users')).toBeInTheDocument();
      expect(within(table()).getByText('Ada Lovelace')).toBeInTheDocument();
      expect(within(table()).queryByText('Alan Turing')).not.toBeInTheDocument();
    });

    it('filters by status', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      await user.selectOptions(screen.getByLabelText('Filter by status'), 'invited');
      expect(await screen.findByText('5 users')).toBeInTheDocument();
      expect(within(table()).getByText('Edsger Dijkstra')).toBeInTheDocument();
      expect(within(table()).queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });
  });

  describe('create', () => {
    async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: 'Create user' }));
      return screen.getByRole('dialog');
    }

    it('creates a user and announces it', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      const dialog = await openCreateDialog(user);
      await user.type(within(dialog).getByLabelText(/^Full name/), 'New Person');
      await user.type(within(dialog).getByLabelText(/^Email/), 'new.person@example.com');
      await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

      expect(await screen.findByText(/New Person saved\./)).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('validates the form client-side before submitting', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      const dialog = await openCreateDialog(user);
      await user.type(within(dialog).getByLabelText(/^Full name/), 'A');
      await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

      expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
    });

    it('surfaces server validation errors for duplicate emails', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('10 users');

      const dialog = await openCreateDialog(user);
      await user.type(within(dialog).getByLabelText(/^Full name/), 'Clone Ada');
      await user.type(within(dialog).getByLabelText(/^Email/), 'ada.lovelace@example.com');
      await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

      expect(await screen.findByText('A user with this email already exists.')).toBeInTheDocument();
    });
  });

  describe('edit', () => {
    it('loads the user into the dialog and saves the changes', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('Ada Lovelace');

      await user.click(within(row('Ada Lovelace')).getByRole('button', { name: 'Edit' }));
      const dialog = screen.getByRole('dialog');
      const nameField = within(dialog).getByLabelText(/^Full name/);
      expect(await within(dialog).findByDisplayValue('Ada Lovelace')).toBeInTheDocument();

      await user.clear(nameField);
      await user.type(nameField, 'Ada King');
      await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText(/Ada King saved\./)).toBeInTheDocument();
      await waitFor(() => {
        expect(within(table()).queryByText('Ada Lovelace')).not.toBeInTheDocument();
      });
      expect(within(table()).getByText('Ada King')).toBeInTheDocument();
    });
  });

  describe('delete', () => {
    it('deletes a user after confirmation and announces it', async () => {
      const user = userEvent.setup();
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('Alan Turing');

      await user.click(within(row('Alan Turing')).getByRole('button', { name: 'Delete' }));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Alan Turing')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      expect(await screen.findByText(/Alan Turing deleted\./)).toBeInTheDocument();
      await waitFor(() => {
        expect(within(table()).queryByText('Alan Turing')).not.toBeInTheDocument();
      });
      // user-2 was removed; the remaining users shift up, so page 1 still
      // shows 10 rows and Katherine Johnson (formerly on page 2) moves in.
      expect(within(table()).getByText('Katherine Johnson')).toBeInTheDocument();
      expect(screen.getByText('10 users')).toBeInTheDocument();
    });

    it('hides the delete action for your own account', async () => {
      await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
      await screen.findByText('Ada Lovelace');

      // user-1 is the signed-in admin; the UI hides delete for it.
      expect(
        within(row('Ada Lovelace')).queryByRole('button', { name: 'Delete' }),
      ).not.toBeInTheDocument();
      expect(
        within(row('Alan Turing')).getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
    });
  });
});
