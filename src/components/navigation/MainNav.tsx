import { NavLink } from 'react-router';

import { cn } from '@/utils/cn';

import styles from './MainNav.module.css';

export interface MainNavItem {
  label: string;
  to: string;
  end?: boolean;
}

/**
 * Primary site navigation using NavLink (active state via aria-current).
 * The caller decides which items to show (e.g. filtered by permission).
 */
export interface MainNavProps {
  items: readonly MainNavItem[];
}

export function MainNav({ items }: MainNavProps) {
  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) => cn(styles.link, isActive && styles.active)}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
