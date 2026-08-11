import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { signIn } from './support/helpers';

/**
 * Full-page accessibility scans (tagged `@a11y`, run via `npm run test:a11y`
 * or as part of the e2e suite). Each scan reports the worst violations so
 * failures are actionable.
 */
test.describe('axe scans', () => {
  test('login page has no violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('users page has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Ada Lovelace');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('component showcase has no violations', async ({ page }) => {
    await signIn(page);
    await page.goto('/components');
    await expect(page.getByRole('heading', { name: 'Components', level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
