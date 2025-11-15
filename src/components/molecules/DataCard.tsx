import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  description?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}

const VARIANT_STYLES = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  destructive: 'text-red-600',
}

export function DataCard({ icon: Icon, label, value, description, variant = 'default', className }: DataCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5', VARIANT_STYLES[variant])} aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-2xl font-bold" aria-label={`${label}: ${value}`}>
              {value}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
