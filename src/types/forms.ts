import type { z } from 'zod'
import type { UseFormReturn } from 'react-hook-form'
import type { ChangeEvent } from 'react'

/**
 * Generic form props with schema validation
 */
export interface FormDialogProps<TSchema extends z.ZodType> {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void
  defaultValues?: Partial<z.infer<TSchema>>
  title: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
}

/**
 * Form field component props
 */
export interface FormFieldProps<TValue = string> {
  value: TValue
  onChange: (value: TValue) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Type-safe form wrapper
 */
export type TypedForm<TSchema extends z.ZodType> = UseFormReturn<z.infer<TSchema>>

/**
 * React event handler types
 */
export type InputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void
export type TextareaChangeHandler = (e: ChangeEvent<HTMLTextAreaElement>) => void
export type SelectChangeHandler = (value: string) => void
export type FormSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => void
export type ButtonClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => void
export type DivClickHandler = (e: React.MouseEvent<HTMLDivElement>) => void

/**
 * Generic event handler with typed value
 */
export type ValueChangeHandler<T> = (value: T) => void

/**
 * Form field change handler
 */
export type FieldChangeHandler<T extends Record<string, unknown>> = <K extends keyof T>(field: K, value: T[K]) => void
