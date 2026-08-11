import { expect, test } from '@playwright/test';

import { VIEWER, signIn } from './support/helpers';

test.describe('auth journey', () => {
  test('redirects an anonymous visitor from a protected route to /login', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('shows a friendly error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /Email/ }).fill('admin@example.com');
    await page.getByRole('textbox', { name: /Password/ }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('signs in and lands back on the requested protected route', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await signIn(page);

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Ada Lovelace');
    await expect(page.getByRole('button', { name: 'Ada Lovelace' })).toBeVisible();
  });

  test('signs out from the header menu and protects the route again', async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('button', { name: 'Ada Lovelace' })).toBeVisible();

    await page.getByRole('button', { name: 'Ada Lovelace' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('a viewer cannot see admin-only actions (permission gating)', async ({ page }) => {
    await signIn(page, VIEWER.email, VIEWER.password);
    await page.goto('/users');

    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create user' })).toHaveCount(0);
    await expect(page.getByRole('table')).toContainText('Ada Lovelace');
    await expect(page.getByRole('table').getByRole('button', { name: 'Delete' })).toHaveCount(0);
  });
});
