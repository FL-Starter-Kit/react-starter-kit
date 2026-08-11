import { Outlet } from 'react-router';

import { Container } from '@/components/layout/Container';

import styles from './AuthLayout.module.css';

/**
 * Layout for authentication pages (login): a centered, minimal card
 * without the site header/footer.
 */
export function AuthLayout() {
  return (
    <main className={styles.main}>
      <Container size="sm" className={styles.container}>
        <div className={styles.brand} aria-hidden="true">
          ◆
        </div>
        <Outlet />
      </Container>
    </main>
  );
}
