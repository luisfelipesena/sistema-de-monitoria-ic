import { cn } from '@/lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

const statusClasses = {
  default:
    'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600',
  error:
    'border-red-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600',
  success:
    'border-green-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600',
  disabled: 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed',
};

const helperTextClasses = {
  default: 'text-gray-500',
  error: 'text-red-600',
  success: 'text-green-600',
};

export interface SelectFieldProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  label?: string;
  helperText?: string;
  status?: 'default' | 'error' | 'success';
  children: React.ReactNode;
  disabled?: boolean;
}

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    status?: 'default' | 'error' | 'success';
    disabled?: boolean;
  }
>(({ className, status = 'default', disabled, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors outline-none',
      statusClasses[disabled ? 'disabled' : status],
      className,
    )}
    disabled={disabled}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const CustomSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    status?: 'default' | 'error' | 'success';
    disabled?: boolean;
  }
>(({ status = 'default', disabled, className, ...props }, ref) => (
  <SelectTrigger
    ref={ref}
    status={status}
    disabled={disabled}
    className={className}
    {...props}
  />
));
CustomSelectTrigger.displayName = 'CustomSelectTrigger';

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-slate-100', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

const SelectField = React.forwardRef<HTMLDivElement, SelectFieldProps>(
  (
    { label, helperText, status = 'default', disabled, children, ...props },
    ref,
  ) => (
    <div className="w-full space-y-1" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}
      <Select disabled={disabled} {...props}>
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement(child) &&
            child.type &&
            (child.type as any).displayName === 'CustomSelectTrigger'
          ) {
            return React.cloneElement(child);
          }
          return child;
        })}
      </Select>
      {helperText && (
        <span className={cn('text-xs mt-1', helperTextClasses[status])}>
          {helperText}
        </span>
      )}
    </div>
  ),
);
SelectField.displayName = 'SelectField';

export {
  CustomSelectTrigger,
  Select,
  SelectContent,
  SelectField,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
