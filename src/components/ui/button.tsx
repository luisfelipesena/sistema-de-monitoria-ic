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
        primary:
          'bg-primary hover:bg-primary-foreground text-white rounded-full',
        secondary:
          'bg-secondary hover:bg-secondary-foreground text-white rounded-full',
        destructive:
          'bg-destructive hover:bg-destructive-foreground text-white rounded-full',
        outline:
          'bg-transparent border border-primary text-primary hover:bg-primary/10 rounded-full',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
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
