import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  message?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

export function LoadingSpinner({ message = "Carregando...", className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-8 gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn("animate-spin text-primary", SIZE_MAP[size])} aria-hidden="true" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
