import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useAuthContext, getReturnPath, clearReturnPath } from '@/lib/auth';
import { ApiError, ErrorCode } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import styles from './LoginPage.module.css';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { status, login } = useAuthContext();
  const [formError, setFormError] = useState<string | null>(null);

  // Send authenticated visitors back to the route they were on. The
  // read+clear must happen in an effect: run during render it would run
  // twice under StrictMode's double render, and the second read (after
  // the path was cleared) would fall back to "/".
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }
    const returnPath = getReturnPath();
    clearReturnPath();
    void navigate(returnPath, { replace: true });
  }, [status, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'authenticated') {
    return null;
  }

  const signIn = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
    } catch (error) {
      if (error instanceof ApiError && error.code === ErrorCode.Unauthorized) {
        setFormError('Invalid email or password.');
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        logger.error('Unexpected login failure', {}, error);
        setFormError('Unable to sign in right now. Please try again.');
      }
    }
  };

  const submitForm = handleSubmit((values) => {
    void signIn(values);
  });

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.subtitle}>
        Demo credentials — <code>admin@example.com</code> / <code>admin123</code> (or viewer@example.com).
      </p>

      {formError !== null && <Alert variant="danger">{formError}</Alert>}

      <form onSubmit={(event) => { void submitForm(event); }} noValidate>
        <FormField name="email" label="Email" error={errors.email?.message} required>
          {(fieldId, describedById) => (
            <Input
              id={fieldId}
              type="email"
              autoComplete="email"
              invalid={errors.email !== undefined}
              aria-describedby={describedById}
              placeholder="you@example.com"
              {...register('email')}
            />
          )}
        </FormField>

        <FormField name="password" label="Password" error={errors.password?.message} required>
          {(fieldId, describedById) => (
            <Input
              id={fieldId}
              type="password"
              autoComplete="current-password"
              invalid={errors.password !== undefined}
              aria-describedby={describedById}
              {...register('password')}
            />
          )}
        </FormField>

        <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Signing in" className={styles.submit}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
