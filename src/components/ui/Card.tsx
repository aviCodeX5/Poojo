import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  key?: any;
}

export const Card = ({ className, padding = 'md', ...props }: CardProps) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-sm border border-orange-100 overflow-hidden',
        paddings[padding],
        className
      )}
      {...props}
    />
  );
};
