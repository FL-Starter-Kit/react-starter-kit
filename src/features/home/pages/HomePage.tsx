import { Link } from 'react-router';

import { getConfig } from '@/app/config/env';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useAuthContext } from '@/lib/auth';

import styles from './HomePage.module.css';

/** Landing page for signed-in users. */
export default function HomePage() {
  const { user } = useAuthContext();
  const { appName } = getConfig();

  return (
    <Container>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${user?.name ?? 'there'}`}
        description={`${appName} is running with the full enterprise foundation: strict TypeScript, typed API layer, server state, accessible components and a testing pyramid.`}
      />

      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className={styles.heading}>
          Explore the starter
        </h2>
        <div className={styles.cards}>
          <Link to="/users" className={styles.card}>
            <span className={styles.cardTitle}>Users</span>
            <span className={styles.cardBody}>Pagination, filtering, forms and permissions — the reference feature.</span>
          </Link>
          <Link to="/components" className={styles.card}>
            <span className={styles.cardTitle}>Components</span>
            <span className={styles.cardBody}>The accessible UI primitives, live, with a theme switcher.</span>
          </Link>
          <div className={styles.card}>
            <span className={styles.cardTitle}>Session</span>
            <span className={styles.cardBody}>
              You are signed in as <Badge>{user?.role ?? 'unknown'}</Badge>. Sign out via the user menu in the header.
            </span>
          </div>
        </div>
      </section>
    </Container>
  );
}
