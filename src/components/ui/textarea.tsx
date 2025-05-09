import { cn } from '@/lib/utils';
import * as React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, helperText, status = 'default', disabled, ...props },
    ref,
  ) => {
    const textareaStatus = disabled ? 'disabled' : status;
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'block w-full rounded-md px-4 py-3 text-base transition-colors outline-none min-h-[80px] border bg-white',
            statusClasses[textareaStatus],
            className,
          )}
          disabled={disabled}
          aria-invalid={status === 'error'}
          aria-describedby={
            helperText ? `${props.id || 'textarea'}-helper` : undefined
          }
          ref={ref}
          {...props}
        />
        {helperText && (
          <span
            id={`${props.id || 'textarea'}-helper`}
            className={cn('text-xs mt-1', helperTextClasses[status])}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
