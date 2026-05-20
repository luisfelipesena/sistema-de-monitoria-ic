import { Label } from '@/components/ui/label'

interface ProjectDetailSectionProps {
  title: string
  children: React.ReactNode
}

export function ProjectDetailSection({ title, children }: ProjectDetailSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </div>
  )
}

interface FieldProps {
  label: string
  value: React.ReactNode
}

export function Field({ label, value }: FieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {typeof value === 'string' || typeof value === 'number' ? <p className="text-sm">{value}</p> : <div>{value}</div>}
    </div>
  )
}
