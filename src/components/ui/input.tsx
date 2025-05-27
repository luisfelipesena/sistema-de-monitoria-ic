import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  status?: 'default' | 'error' | 'success';
}

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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      helperText,
      status = 'default',
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputStatus = disabled ? 'disabled' : status;
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px]',
            statusClasses[inputStatus],
            className,
          )}
          disabled={disabled}
          aria-invalid={status === 'error'}
          aria-describedby={
            helperText ? `${props.id || 'input'}-helper` : undefined
          }
          ref={ref}
          {...props}
        />
        {helperText && (
          <span
            id={`${props.id || 'input'}-helper`}
            className={cn('text-xs mt-1', helperTextClasses[status])}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
