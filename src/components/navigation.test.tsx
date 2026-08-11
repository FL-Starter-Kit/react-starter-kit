import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { MainNav } from '@/components/navigation/MainNav';
import { renderWithProviders } from '@/tests/render';

describe('Breadcrumbs', () => {
  it('renders links for all but the last crumb', () => {
    renderWithProviders(
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Users', to: '/users' },
          { label: 'Details' },
        ]}
      />,
    );

    const home = screen.getByRole('link', { name: 'Home' });
    const users = screen.getByRole('link', { name: 'Users' });
    expect(home).toHaveAttribute('href', '/');
    expect(users).toHaveAttribute('href', '/users');
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('is a labelled navigation landmark', () => {
    renderWithProviders(
      <Breadcrumbs aria-label="Trail" items={[{ label: 'Home', to: '/' }, { label: 'End' }]} />,
    );
    expect(screen.getByRole('navigation', { name: 'Trail' })).toBeInTheDocument();
  });
});

describe('MainNav', () => {
  it('renders nav links with the active one marked', () => {
    renderWithProviders(
      <MainNav items={[{ label: 'Home', to: '/', end: true }, { label: 'Users', to: '/users' }]} />,
      { initialEntries: ['/users'] },
    );

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });
});
