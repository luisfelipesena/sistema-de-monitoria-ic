import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
  default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border-transparent bg-gray-200 text-gray-800 hover:bg-gray-300',
  destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
  success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600',
  warning: 'border-transparent bg-yellow-400 text-black hover:bg-yellow-500',
  muted: 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200',
  outline: 'border border-gray-300 text-gray-800 hover:bg-gray-100',
  retaVerde: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600 rounded-none',
  retaVermelha: 'border-transparent bg-red-500 text-white hover:bg-red-600 rounded-none',
},
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
