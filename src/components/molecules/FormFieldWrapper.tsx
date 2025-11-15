import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { UseFormReturn } from 'react-hook-form'
import type { ReactNode } from 'react'

interface FormFieldWrapperProps {
  form: UseFormReturn<any>
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea'
  required?: boolean
  description?: string
  children?: ReactNode
  disabled?: boolean
}

export function FormFieldWrapper({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  description,
  children,
  disabled = false,
}: FormFieldWrapperProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="obrigatório">
                *
              </span>
            )}
          </FormLabel>
          <FormControl>
            {children ||
              (type === 'textarea' ? (
                <Textarea
                  placeholder={placeholder}
                  {...field}
                  disabled={disabled}
                  aria-required={required}
                  aria-describedby={description ? `${name}-description` : undefined}
                />
              ) : (
                <Input
                  type={type}
                  placeholder={placeholder}
                  {...field}
                  disabled={disabled}
                  aria-required={required}
                  aria-describedby={description ? `${name}-description` : undefined}
                />
              ))}
          </FormControl>
          {description && (
            <FormDescription id={`${name}-description`}>{description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
