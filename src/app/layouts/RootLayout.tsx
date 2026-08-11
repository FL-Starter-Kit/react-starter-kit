import { Outlet } from 'react-router';

import { AppHeader } from '@/app/layouts/AppHeader';

import styles from './RootLayout.module.css';

/**
 * Root layout for authenticated pages: skip link, header, main landmark
 * and footer. The main landmark is targetable by the skip link.
 */
export function RootLayout() {
  return (
    <div className={styles.root}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <AppHeader />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>Enterprise React Starter</p>
      </footer>
    </div>
  );
}
