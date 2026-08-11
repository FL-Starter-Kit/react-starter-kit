import { useEffect } from 'react';
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logging/logger';

/**
 * Renders friendly UI for route-level failures (loader/action/render).
 * Uses the route error's status when available; never shows internals.
 */
export function RouteErrorScreen() {
  const error = useRouteError();
  const location = useLocation();

  useEffect(() => {
    logger.error('Route error', { pathname: location.pathname }, error);
  }, [error, location.pathname]);

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <EmptyState
          title="Page not found"
          description="The page you are looking for does not exist or has been moved."
          action={
            <Button onClick={() => { window.history.back(); }}>Go back</Button>
          }
        />
      );
    }
    if (error.status === 403) {
      return (
        <EmptyState
          title="Access denied"
          description="You do not have permission to view this page."
        />
      );
    }
  }

  return (
    <ErrorState
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. Please try again."
      onRetry={() => { window.location.reload(); }}
    />
  );
}
