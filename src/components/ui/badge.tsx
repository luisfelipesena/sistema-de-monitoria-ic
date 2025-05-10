import { cn } from '@/lib/utils';
import * as React from 'react';

const variantClasses = {
  success: 'bg-green-200 text-green-800',
  danger: 'bg-red-200 text-red-800',
  warning: 'bg-yellow-200 text-yellow-800',
  info: 'bg-sky-200 text-sky-800',
  volunteer: 'bg-indigo-200 text-indigo-800',
  muted: 'bg-gray-200 text-gray-800',
};

const roundedClasses = {
  full: 'rounded-full',
  md: 'rounded-md',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantClasses;
  rounded?: keyof typeof roundedClasses;
}

export function Badge({
  className,
  variant = 'muted',
  rounded = 'md',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'px-3 py-1 text-xs font-semibold',
        variantClasses[variant],
        roundedClasses[rounded],
        className,
      )}
      {...props}
    />
  );
}
