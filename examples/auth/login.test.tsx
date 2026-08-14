import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { scenario } from '@/tests/mocks/scenario';
import { renderApp } from '@/tests/renderApp';

describe('Login flow', () => {
  it('rejects invalid credentials with a visible error', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/login'] });

    await user.type(screen.getByLabelText(/Email/), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid email or password.');
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/login'] });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  it('rejects malformed emails', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/login'] });

    await user.type(screen.getByLabelText(/Email/), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('signs in with valid credentials and redirects to the return path', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/login'] });

    await user.type(screen.getByLabelText(/Email/), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // After login the app should land on the home page (no return path set).
    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });

  it('redirects authenticated users away from the login page', async () => {
    await renderApp({ initialEntries: ['/login'], sessionUserId: 'user-1' });

    // Admin session already exists → /login must not render.
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('returns the user to the page they originally requested', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/users'] });

    // No session → ProtectedRoute remembers /users and redirects to login.
    await screen.findByRole('heading', { name: 'Sign in' }, { timeout: 4000 });

    await user.type(screen.getByLabelText(/Email/), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Redirected back to the originally-requested page.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
    });
  });

  it('signs out from the header menu and lands on the login page', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });
    await screen.findByRole('heading', { name: 'Users', level: 1 });

    await user.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });
});

describe('Session lifecycle', () => {
  it('silently refreshes an expired session and stays signed in', async () => {
    scenario.auth.expireNextRequest = true;
    await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

    // The 401 is absorbed by the silent refresh; the user never notices.
    expect(await screen.findByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('transitions to the login page when the silent refresh fails', async () => {
    scenario.auth.expireNextRequest = true;
    scenario.auth.failNextRefresh = true;
    await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

    // Single authoritative transition: authenticated → 401 → refresh → FAIL → unauthenticated → login.
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Users', level: 1 })).not.toBeInTheDocument();
  });

  it('can sign back in after an expired session', async () => {
    const user = userEvent.setup();
    scenario.auth.expireNextRequest = true;
    scenario.auth.failNextRefresh = true;
    await renderApp({ initialEntries: ['/users'], sessionUserId: 'user-1' });

    await screen.findByRole('heading', { name: 'Sign in' });

    await user.type(screen.getByLabelText(/Email/), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
    });
  });
});
