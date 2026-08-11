/**
 * Runtime validation schemas for the Users API.
 *
 * Server responses are validated at runtime (never trusted blindly) —
 * a contract breach fails the request loudly for developers while
 * presenting a generic error to users. The RHF form schema lives in
 * `userFormSchemas.ts` because form values differ from wire payloads.
 */

import { z } from 'zod';

import { UserRole, UserStatus } from '@/features/users/models/user';

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
