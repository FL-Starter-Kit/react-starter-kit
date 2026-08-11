import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
import type { User } from '@/features/users/models/user';
import { usersService } from '@/features/users/services/usersService';

import styles from './UserTable.module.css';

export interface UserTableProps {
  users: readonly User[];
  /** Whether the current user may edit rows. */
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string | undefined;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/** Accessible data table for the user list. */
export function UserTable({ users, canUpdate, canDelete, currentUserId, onEdit, onDelete }: UserTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          {users.length} user{users.length === 1 ? '' : 's'}
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const deletable = canDelete && usersService.canDelete(user, currentUserId);
            return (
              <tr key={user.id}>
                <th scope="row" className={styles.name}>
                  {user.name}
                </th>
                <td>{user.email}</td>
                <td>{usersService.roleLabel(user.role)}</td>
                <td>
                  <UserStatusBadge status={user.status} />
                </td>
                <td className={styles.actions}>
                  {canUpdate && (
                    <button type="button" className={styles.action} onClick={() => { onEdit(user); }}>
                      Edit
                    </button>
                  )}
                  {deletable && (
                    <button
                      type="button"
                      className={`${styles.action} ${styles.danger}`}
                      onClick={() => { onDelete(user); }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
