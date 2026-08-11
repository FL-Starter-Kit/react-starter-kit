import { useNavigate } from 'react-router';

import { useTheme } from '@/app/providers/themeContext';
import type { ThemeMode } from '@/app/providers/themeContext';
import { MainNav, type MainNavItem } from '@/components/navigation/MainNav';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { IconButton } from '@/components/ui/IconButton';
import { useAuthContext } from '@/lib/auth';

import styles from './AppHeader.module.css';

const NAV_ITEMS: readonly MainNavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'Users', to: '/users' },
  { label: 'Components', to: '/components' },
];

const THEME_CYCLE: Readonly<Record<ThemeMode, ThemeMode>> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

/**
 * Site header: brand, main navigation, theme toggle and the signed-in
 * user menu. The user menu is a plain dropdown — authorization for its
 * actions is handled by the backend on each request.
 */
export function AppHeader() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  const userMenuItems = [
    {
      label: `Signed in as ${user?.email ?? 'unknown'}`,
      onSelect: () => {
        // No-op informational item.
      },
    },
    {
      label: 'Sign out',
      onSelect: () => {
        // Await the session clear before navigating: LoginPage redirects
        // authenticated visitors away, so navigating first would bounce
        // the user straight back off /login.
        void (async () => {
          await logout();
          await navigate('/login');
        })();
      },
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.brand} aria-hidden="true">
        ◆
      </div>
      <MainNav items={NAV_ITEMS} />
      <div className={styles.spacer} />
      <IconButton
        aria-label={`Theme: ${mode}. Activate to switch.`}
        variant="ghost"
        onClick={() => { setMode(THEME_CYCLE[mode]); }}
      >
        <span aria-hidden="true">{mode === 'dark' ? '◐' : '◑'}</span>
      </IconButton>
      <DropdownMenu triggerLabel={user?.name ?? 'Account'} menuLabel="User menu" items={userMenuItems} />
    </header>
  );
}
