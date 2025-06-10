import * as React from "react"

import { cn } from "@/utils/cn"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  status?: "default" | "error" | "success"
}

const statusClasses = {
  default: "border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600",
  error: "border-red-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600",
  success: "border-green-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600",
  disabled: "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed",
}

const helperTextClasses = {
  default: "text-gray-500",
  error: "text-red-600",
  success: "text-green-600",
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, status = "default", disabled, ...props }, ref) => {
    const inputStatus = disabled ? "disabled" : status
    return (
      <div className="w-full space-y-1">
        {label && <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white resize-y",
            statusClasses[inputStatus],
            className
          )}
          disabled={disabled}
          aria-invalid={status === "error"}
          aria-describedby={helperText ? `${props.id || "textarea"}-helper` : undefined}
          ref={ref}
          {...props}
        />
        {helperText && (
          <span id={`${props.id || "textarea"}-helper`} className={cn("text-xs mt-1", helperTextClasses[status])}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
