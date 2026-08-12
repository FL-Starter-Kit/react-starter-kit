import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserFilters, type UserListQueryUpdate } from '@/features/users/components/UserFilters';
import { UserFormDialog } from '@/features/users/components/UserFormDialog';
import { UserTable } from '@/features/users/components/UserTable';
import { useDeleteUser, useUsers } from '@/features/users/hooks/useUsers';
import { PAGE_SIZE_OPTIONS, type User } from '@/features/users/models/user';
import { userListQuerySchema } from '@/features/users/schemas/userSchemas';
import { announce } from '@/lib/accessibility/liveRegion';
import { useAuthContext } from '@/lib/auth';
import { ApiError, ErrorCode } from '@/lib/http';
import { logger } from '@/lib/logging/logger';
import { parseQueryParams } from '@/utils/url';

import styles from './UsersPage.module.css';

/**
 * Users list page — the reference feature.
 * URL search params are the source of truth for the query state
 * (page/search/role/status), so filters survive reloads and deep links.
 * Params are parsed through a Zod schema (userListQuerySchema) with
 * deterministic fallbacks — `?page=abc` safely becomes page 1.
 */
export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseQueryParams(searchParams, userListQuerySchema), [searchParams]);
  const usersQuery = useUsers(query);

  // Mirror of the latest query so updates issued in the same tick build on
  // each other. setSearchParams deliberately does NOT queue same-tick calls
  // (see react-router docs), so we serialize through this ref instead and
  // let the URL re-render stay in sync.
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const { user: currentUser, can } = useAuthContext();
  const deleteMutation = useDeleteUser();
  const [formDialog, setFormDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canCreate = can('users:create');
  const canUpdate = can('users:update');
  const canDelete = can('users:delete');

  const updateQuery = useCallback(
    (next: UserListQueryUpdate) => {
      const merged = { ...queryRef.current, ...next };
      queryRef.current = merged;
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) {
          continue;
        }
        params.set(key, String(value));
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const handleSaved = (saved: User) => {
    announce(`User ${saved.name} saved.`);
  };

  const handleDelete = async () => {
    if (deleteTarget === null) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      announce(`User ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      if (query.page > 1 && usersQuery.data?.totalPages === query.page) {
        updateQuery({ page: query.page - 1 });
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === ErrorCode.Forbidden) {
        setActionError('You do not have permission to delete users.');
      } else if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        logger.error('Delete failed unexpectedly', {}, error);
        setActionError('Unable to delete the user. Please try again.');
      }
    }
  };

  return (
    <Container>
      <PageHeader
        eyebrow="Reference feature"
        title="Users"
        description="A complete feature demonstrating server state, URL state, forms, permissions, loading/error/empty states and accessible UI."
        actions={
          canCreate && (
            <Button
              onClick={() => {
                setFormDialog({ open: true, user: null });
              }}
            >
              Create user
            </Button>
          )
        }
      />

      {actionError !== null && (
        <Alert
          variant="danger"
          onDismiss={() => {
            setActionError(null);
          }}
          className={styles.inlineAlert}
        >
          {actionError}
        </Alert>
      )}

      <UserFilters query={query} onQueryChange={updateQuery} />

      <section aria-labelledby="users-results-heading" className={styles.results}>
        <h2 id="users-results-heading" className="visually-hidden">
          User results
        </h2>

        {usersQuery.isPending ? (
          <TableSkeleton rows={query.pageSize} />
        ) : usersQuery.isError ? (
          <ErrorState
            title="Could not load users"
            description="The user list could not be loaded. Check your connection and try again."
            onRetry={() => void usersQuery.refetch()}
          />
        ) : usersQuery.data.items.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              query.search !== undefined
                ? 'No users match your search. Try different filters.'
                : 'Get started by creating the first user.'
            }
            action={
              canCreate ? (
                <Button
                  onClick={() => {
                    setFormDialog({ open: true, user: null });
                  }}
                >
                  Create user
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <UserTable
              users={usersQuery.data.items}
              canUpdate={canUpdate}
              canDelete={canDelete}
              currentUserId={currentUser?.id}
              onEdit={(user) => {
                setFormDialog({ open: true, user });
              }}
              onDelete={setDeleteTarget}
            />
            <Pagination
              className={styles.pagination}
              page={query.page}
              totalPages={usersQuery.data.totalPages}
              onPageChange={(page) => {
                updateQuery({ page });
              }}
              pageSize={query.pageSize}
              pageSizes={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(pageSize) => {
                updateQuery({ pageSize, page: 1 });
              }}
            />
          </>
        )}
      </section>

      <UserFormDialog
        open={formDialog.open}
        user={formDialog.user}
        onOpenChange={(open) => {
          setFormDialog((current) => ({ ...current, open }));
        }}
        onSaved={handleSaved}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete user"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              loading={deleteMutation.isPending}
              loadingLabel="Deleting user"
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Dialog>
    </Container>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.skeletonTable} role="status" aria-label="Loading users">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height="2.75rem" />
      ))}
    </div>
  );
}
