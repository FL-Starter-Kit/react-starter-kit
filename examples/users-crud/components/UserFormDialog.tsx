import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import { useCreateUser, useUpdateUser, toUserInput } from '../hooks/useUsers';
import { UserRole, UserStatus, type User } from '../models/user';
import { emptyUserForm, userFormSchema, type UserFormValues } from '../schemas/userFormSchemas';

export interface UserFormDialogProps {
  /** When set, the dialog edits this user; otherwise it creates. */
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the saved user so the page can announce it. */
  onSaved: (user: User) => void;
}

/** Create/edit user dialog with field-level validation and server errors. */
export function UserFormDialog({ user, open, onOpenChange, onSaved }: UserFormDialogProps) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, readonly string[]>>({});

  const isEdit = user !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyUserForm,
  });

  // Load the user's values whenever the dialog targets a user. `reset` is
  // an external system (react-hook-form), so the effect is the right place.
  useEffect(() => {
    if (!open) {
      return;
    }
    if (user !== null) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      reset(emptyUserForm);
    }
  }, [open, user, reset]);

  // Clear server errors when the dialog target changes — render-time
  // adjustment instead of an effect (React-sanctioned pattern).
  const targetKey = !open ? 'closed' : (user?.id ?? 'new');
  const [lastTargetKey, setLastTargetKey] = useState('closed');
  if (targetKey !== lastTargetKey) {
    setLastTargetKey(targetKey);
    setServerError(null);
    setServerFieldErrors({});
  }

  const saveUser = async (values: UserFormValues) => {
    setServerError(null);
    setServerFieldErrors({});
    const input = toUserInput(values);
    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync({ id: user.id, input })
        : await createMutation.mutateAsync(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        setServerError(error.message);
        setServerFieldErrors(error.fieldErrors);
      } else if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        logger.error('User save failed unexpectedly', {}, error);
        setServerError('Unable to save the user. Please try again.');
      }
    }
  };

  const submitForm = handleSubmit((values) => {
    void saveUser(values);
  });

  const fieldError = (field: keyof UserFormValues): string | undefined => {
    const clientError = errors[field]?.message;
    if (clientError !== undefined) {
      return clientError;
    }
    const serverMessages = serverFieldErrors[field];
    return serverMessages !== undefined && serverMessages.length > 0
      ? serverMessages[0]
      : undefined;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${user.name}` : 'Create user'}
      description={isEdit ? 'Update the user details below.' : 'Add a new user to the directory.'}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-form"
            loading={isSubmitting}
            loadingLabel={isEdit ? 'Saving user' : 'Creating user'}
            disabled={!isDirty && isEdit}
          >
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      {serverError !== null && <Alert variant="danger">{serverError}</Alert>}

      <form
        id="user-form"
        onSubmit={(event) => {
          void submitForm(event);
        }}
        noValidate
      >
        <FormField name="name" label="Full name" error={fieldError('name')} required>
          {(fieldId, describedById) => (
            <Input
              id={fieldId}
              autoComplete="name"
              invalid={fieldError('name') !== undefined}
              aria-describedby={describedById}
              {...register('name')}
            />
          )}
        </FormField>

        <FormField name="email" label="Email" error={fieldError('email')} required>
          {(fieldId, describedById) => (
            <Input
              id={fieldId}
              type="email"
              autoComplete="email"
              invalid={fieldError('email') !== undefined}
              aria-describedby={describedById}
              {...register('email')}
            />
          )}
        </FormField>

        <FormField name="role" label="Role" error={fieldError('role')} required>
          {(fieldId, describedById) => (
            <Select
              id={fieldId}
              invalid={fieldError('role') !== undefined}
              aria-describedby={describedById}
              {...register('role')}
            >
              <option value={UserRole.Viewer}>Viewer</option>
              <option value={UserRole.Editor}>Editor</option>
              <option value={UserRole.Admin}>Admin</option>
            </Select>
          )}
        </FormField>

        <FormField name="status" label="Status" error={fieldError('status')} required>
          {(fieldId, describedById) => (
            <Select
              id={fieldId}
              invalid={fieldError('status') !== undefined}
              aria-describedby={describedById}
              {...register('status')}
            >
              <option value={UserStatus.Active}>Active</option>
              <option value={UserStatus.Invited}>Invited</option>
              <option value={UserStatus.Disabled}>Disabled</option>
            </Select>
          )}
        </FormField>
      </form>
    </Dialog>
  );
}
