/**
 * Server-state hooks for the Users feature (TanStack Query).
 * UI state (dialog open, filters) stays in components; URL state stays in
 * the router; only server data lives here.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usersApi } from '@/features/users/api/usersApi';
import type { UserInput, UserListQuery } from '@/features/users/models/user';
import type { ValidatedUserInput } from '@/features/users/schemas/userSchemas';

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (query: UserListQuery) => ['users', 'list', query] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

/** Paginated user list; `placeholderData` keeps the previous page visible while fetching. */
export function useUsers(query: UserListQuery) {
  return useQuery({
    queryKey: usersQueryKeys.list(query),
    queryFn: ({ signal }) => usersApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Single user by id. */
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => (id !== undefined ? usersApi.get(id, signal) : Promise.resolve(null)),
    enabled: id !== undefined,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return {
    invalidateList: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
    setDetail: (user: Awaited<ReturnType<typeof usersApi.get>>) =>
      queryClient.setQueryData(usersQueryKeys.detail(user.id), user),
  };
}

export function useCreateUser() {
  const { invalidateList, setDetail } = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: ValidatedUserInput) => usersApi.create(input),
    onSuccess: (user) => {
      setDetail(user);
      void invalidateList();
    },
  });
}

export function useUpdateUser() {
  const { invalidateList, setDetail } = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ValidatedUserInput }) => usersApi.update(id, input),
    onSuccess: (user) => {
      setDetail(user);
      void invalidateList();
    },
  });
}

export function useDeleteUser() {
  const { invalidateList } = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => void invalidateList(),
  });
}

/** Utility: shape a form's values into the API input payload. */
export function toUserInput(input: UserInput): ValidatedUserInput {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: input.status,
  };
}
