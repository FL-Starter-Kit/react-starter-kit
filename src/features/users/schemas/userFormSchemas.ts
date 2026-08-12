/**
 * Zod schema for the create/edit user FORM. Field shapes mirror the API
 * input schema but carry user-facing validation messages and trim rules.
 */

import { z } from 'zod';

import { UserRole, UserStatus } from '@/features/users/models/user';

export const userFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  role: z.enum([UserRole.Admin, UserRole.Editor, UserRole.Viewer], { message: 'Select a role.' }),
  status: z.enum([UserStatus.Active, UserStatus.Invited, UserStatus.Disabled], {
    message: 'Select a status.',
  }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const emptyUserForm: UserFormValues = {
  name: '',
  email: '',
  role: UserRole.Viewer,
  status: UserStatus.Active,
};
