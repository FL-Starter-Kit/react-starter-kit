import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import {
  UserRole,
  UserStatus,
  type UserListQuery,
  type UserRoleValue,
  type UserStatusValue,
} from '../models/user';

import styles from './UserFilters.module.css';

export interface UserFiltersProps {
  query: UserListQuery;
  onQueryChange: (next: UserListQueryUpdate) => void;
}

/** Fields that may be updated; `undefined` clears the filter. */
export interface UserListQueryUpdate {
  page?: number;
  pageSize?: number;
  search?: string | undefined;
  role?: UserRoleValue | undefined;
  status?: UserStatusValue | undefined;
}

/** Filter toolbar: debounced search + role/status selects. */
export function UserFilters({ query, onQueryChange }: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState(query.search ?? '');
  const [previousSearch, setPreviousSearch] = useState(query.search ?? '');

  // Keep the input in sync when the URL changes externally (e.g. back button).
  // Render-time adjustment is the React-sanctioned alternative to an effect.
  const nextSearch = query.search ?? '';
  if (nextSearch !== previousSearch) {
    setPreviousSearch(nextSearch);
    setSearchInput(nextSearch);
  }

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== (query.search ?? '')) {
      onQueryChange({ search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch, onQueryChange, query.search]);

  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <Label htmlFor="user-search" hideVisually>
          Search users
        </Label>
        <Input
          id="user-search"
          type="search"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
        />
      </div>

      <div className={styles.select}>
        <Label htmlFor="user-role-filter" hideVisually>
          Filter by role
        </Label>
        <Select
          id="user-role-filter"
          value={query.role ?? ''}
          onChange={(event) => {
            onQueryChange({
              role: (event.target.value || undefined) as UserRoleValue | undefined,
              page: 1,
            });
          }}
        >
          <option value="">All roles</option>
          <option value={UserRole.Admin}>Admin</option>
          <option value={UserRole.Editor}>Editor</option>
          <option value={UserRole.Viewer}>Viewer</option>
        </Select>
      </div>

      <div className={styles.select}>
        <Label htmlFor="user-status-filter" hideVisually>
          Filter by status
        </Label>
        <Select
          id="user-status-filter"
          value={query.status ?? ''}
          onChange={(event) => {
            onQueryChange({
              status: (event.target.value || undefined) as UserStatusValue | undefined,
              page: 1,
            });
          }}
        >
          <option value="">All statuses</option>
          <option value={UserStatus.Active}>Active</option>
          <option value={UserStatus.Invited}>Invited</option>
          <option value={UserStatus.Disabled}>Disabled</option>
        </Select>
      </div>
    </div>
  );
}
