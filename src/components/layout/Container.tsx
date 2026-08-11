import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './Container.module.css';

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
}

/** Centered content container with responsive max width. */
export function Container({ size = 'lg', className, children, ...rest }: ContainerProps) {
  return (
    <div className={cn(styles.container, styles[size], className)} {...rest}>
      {children}
    </div>
  );
}
