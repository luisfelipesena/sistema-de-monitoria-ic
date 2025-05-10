import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 gap-1',
  {
    variants: {
      variant: {
        primary: 'bg-[#53BDEC] hover:bg-[#53BDEC]/90 text-white rounded-full',
        secondary: 'bg-[#1B4377] hover:bg-[#1B4377]/90 text-white rounded-full',
        cancel: 'bg-[#C92F2F] hover:bg-[#C92F2F]/90 text-white rounded-full',
        disabled: 'bg-[#A7A7A7] text-white rounded-full',
        transparent: 'bg-transparent text-black rounded-full',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    // Se estiver desabilitado ou em loading, força a variante disabled
    const effectiveVariant = disabled || isLoading ? 'disabled' : variant;
    return (
      <Comp
        className={cn(
          buttonVariants({ variant: effectiveVariant, size, className }),
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <React.Fragment>
            <Loader2 className="animate-spin" />
            {children}
          </React.Fragment>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
