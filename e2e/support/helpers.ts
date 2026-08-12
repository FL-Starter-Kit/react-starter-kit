import type { Page } from '@playwright/test';

export const ADMIN = { email: 'admin@example.com', password: 'admin123' };
export const VIEWER = { email: 'viewer@example.com', password: 'viewer123' };

/**
 * Sign in through the real login form. The mock backend persists the
 * session (localStorage in browser mode) for the rest of the test.
 */
export async function signIn(
  page: Page,
  email: string = ADMIN.email,
  password: string = ADMIN.password,
): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /Email/ }).fill(email);
  await page.getByRole('textbox', { name: /Password/ }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
