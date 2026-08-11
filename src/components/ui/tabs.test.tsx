import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tabs } from '@/components/ui/Tabs';

const items = [
  { id: 'overview', label: 'Overview', content: <p>Overview content</p> },
  { id: 'activity', label: 'Activity', content: <p>Activity content</p>, disabled: true },
  { id: 'settings', label: 'Settings', content: <p>Settings content</p> },
];

describe('Tabs', () => {
  it('renders a tablist with labelled tabs and the active panel', () => {
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={() => undefined} />,
    );

    expect(screen.getByRole('tablist', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Overview content')).toBeVisible();
    expect(screen.getByText('Settings content')).not.toBeVisible();
    expect(screen.getByText('Settings content').parentElement).toHaveAttribute('hidden');
  });

  it('switches panels when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onActiveTabChange = vi.fn();
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={onActiveTabChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(onActiveTabChange).toHaveBeenCalledWith('settings');
  });

  it('links panels to their tabs via aria-labelledby and aria-controls', () => {
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={() => undefined} />,
    );
    const tab = screen.getByRole('tab', { name: 'Overview' });
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.getAttribute('id'));
    expect(tab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
  });

  it('disables inactive tabs with roving tabindex', () => {
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={() => undefined} />,
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus and activates the next enabled tab with ArrowRight', async () => {
    const user = userEvent.setup();
    const onActiveTabChange = vi.fn();
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={onActiveTabChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    await user.keyboard('{ArrowRight}');
    expect(onActiveTabChange).toHaveBeenCalledWith('settings');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveFocus();
  });

  it('does not activate disabled tabs', () => {
    render(
      <Tabs aria-label="Profile" items={items} activeTabId="overview" onActiveTabChange={() => undefined} />,
    );
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeDisabled();
  });
});
