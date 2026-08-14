/**
 * Runtime validation schemas for the Users API.
 *
 * Server responses are validated at runtime (never trusted blindly) —
 * a contract breach fails the request loudly for developers while
 * presenting a generic error to users. The RHF form schema lives in
 * `userFormSchemas.ts` because form values differ from wire payloads.
 */

import { z } from 'zod';

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, UserRole, UserStatus } from '../models/user';

const timestampSchema = z.iso.datetime();

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum([UserRole.Admin, UserRole.Editor, UserRole.Viewer]),
  status: z.enum([UserStatus.Active, UserStatus.Invited, UserStatus.Disabled]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type ValidatedUser = z.infer<typeof userSchema>;

export const userListSchema = z.object({
  items: z.array(userSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type ValidatedUserList = z.infer<typeof userListSchema>;

/** Wire payload for create/update. `id`/timestamps are server-owned. */
export const userInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum([UserRole.Admin, UserRole.Editor, UserRole.Viewer]),
  status: z.enum([UserStatus.Active, UserStatus.Invited, UserStatus.Disabled]),
});

export type ValidatedUserInput = z.infer<typeof userInputSchema>;

/**
 * URL search-param state for the users list page. Every field has a
 * deterministic fallback so malformed URLs (e.g. `?page=abc`) degrade to
 * safe defaults instead of NaN/unexpected values. Parsed via
 * `parseQueryParams` (src/utils/url.ts).
 */
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .refine((value) => (PAGE_SIZE_OPTIONS as readonly number[]).includes(value))
    .catch(DEFAULT_PAGE_SIZE),
  search: z.string().min(1).optional().catch(undefined),
  role: z.enum([UserRole.Admin, UserRole.Editor, UserRole.Viewer]).optional().catch(undefined),
  status: z
    .enum([UserStatus.Active, UserStatus.Invited, UserStatus.Disabled])
    .optional()
    .catch(undefined),
});

export type ValidatedUserListQuery = z.infer<typeof userListQuerySchema>;
