import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import { ErrorState } from '@/components/feedback/ErrorState';
import { logger } from '@/lib/logging/logger';

interface KeyedErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Route-aware wrapper that resets the inner boundary on navigation.
 * Rendered once at the app root.
 */
export function AppErrorBoundary({ children }: KeyedErrorBoundaryProps) {
  const location = useLocation();
  return <GlobalErrorBoundary key={location.key}>{children}</GlobalErrorBoundary>;
}

/**
 * Catches unexpected render/lifecycle errors anywhere below it, logs them
 * for developers, and shows a safe, generic message to the user.
 */
export class GlobalErrorBoundary extends Component<KeyedErrorBoundaryProps, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled application error', { componentStack: info.componentStack }, error);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          description="An unexpected error occurred. Please try again."
          onRetry={() => {
            this.setState({ hasError: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}
