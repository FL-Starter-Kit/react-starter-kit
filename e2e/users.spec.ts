import { expect, test } from '@playwright/test';

import { signIn } from './support/helpers';

test.describe('users feature (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
  });

  test('paginates through all 25 seeded users', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table.getByText('Ada Lovelace')).toBeVisible();
    await expect(page.getByText('10 users')).toBeVisible();

    await page.getByRole('button', { name: '2' }).click();
    await expect(table.getByText('Katherine Johnson')).toBeVisible();
    await expect(table.getByText('Ada Lovelace')).toHaveCount(0);

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('5 users')).toBeVisible();
    await expect(table.getByText('Sophie Wilson')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  test('filters by search term (debounced)', async ({ page }) => {
    const table = page.getByRole('table');
    await page.getByLabel('Search users').fill('ada');

    await expect(page.getByText('1 user')).toBeVisible();
    await expect(table.getByText('Ada Lovelace')).toBeVisible();
    await expect(table.getByText('Alan Turing')).toHaveCount(0);
  });

  test('filters by role and status', async ({ page }) => {
    const table = page.getByRole('table');

    await page.getByLabel('Filter by role').selectOption('admin');
    await expect(page.getByText('5 users')).toBeVisible();
    await expect(table.getByText('Ada Lovelace')).toBeVisible();
    await expect(table.getByText('Alan Turing')).toHaveCount(0);

    await page.getByLabel('Filter by role').selectOption('');
    await page.getByLabel('Filter by status').selectOption('invited');
    await expect(page.getByText('5 users')).toBeVisible();
    await expect(table.getByText('Edsger Dijkstra')).toBeVisible();
  });

  test('creates a user through the dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Create user' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^Full name/ }).fill('Kathleen Antonelli');
    await dialog.getByRole('textbox', { name: /^Email/ }).fill('kathleen.antonelli@example.com');
    await dialog.getByRole('combobox', { name: /^Role/ }).selectOption('Editor');
    await dialog.getByRole('combobox', { name: /^Status/ }).selectOption('Active');
    await dialog.getByRole('button', { name: 'Create user' }).click();

    await expect(page.getByText('User Kathleen Antonelli saved.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByLabel('Search users').fill('kathleen.antonelli');
    await expect(page.getByText('1 user')).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Kathleen Antonelli');
  });

  test('validates the form before submitting and surfaces server errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Create user' }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByRole('textbox', { name: /^Full name/ }).fill('A');
    await dialog.getByRole('button', { name: 'Create user' }).click();

    await expect(dialog.getByText('Name must be at least 2 characters.')).toBeVisible();
    await expect(dialog.getByText('Email is required.')).toBeVisible();

    // Duplicate email comes back from the server as a field error.
    await dialog.getByRole('textbox', { name: /^Full name/ }).fill('Clone Ada');
    await dialog.getByRole('textbox', { name: /^Email/ }).fill('ada.lovelace@example.com');
    await dialog.getByRole('button', { name: 'Create user' }).click();

    await expect(dialog.getByText('A user with this email already exists.')).toBeVisible();
  });

  test('edits a user and sees the updated row', async ({ page }) => {
    const row = page.getByRole('row', { name: /Ada Lovelace/ });
    await row.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Edit Ada Lovelace' })).toBeVisible();
    await dialog.getByRole('textbox', { name: /^Full name/ }).fill('Ada King');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('User Ada King saved.')).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Ada King');
    await expect(page.getByRole('table').getByText('Ada Lovelace')).toHaveCount(0);
  });

  test('deletes a user after confirmation', async ({ page }) => {
    const row = page.getByRole('row', { name: /Alan Turing/ });
    await row.getByRole('button', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Delete user' })).toBeVisible();
    await expect(dialog).toContainText('Alan Turing');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('User Alan Turing deleted.')).toBeVisible();
    await expect(page.getByRole('table').getByText('Alan Turing')).toHaveCount(0);
  });

  test('cannot delete your own account', async ({ page }) => {
    const ownRow = page.getByRole('row', { name: /Ada Lovelace/ });
    await expect(ownRow.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await expect(ownRow.getByRole('button', { name: 'Edit' })).toBeVisible();
  });
});
