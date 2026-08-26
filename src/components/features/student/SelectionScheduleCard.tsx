import { cn } from '@/utils/cn'
import { formatDateLongUTC } from '@/utils/date-utils'
import type { SelecaoSchedule } from '@/types'
import { CalendarDays, Clock3, Info, MapPin } from 'lucide-react'
import React from 'react'

interface SelectionScheduleCardProps {
  schedule: SelecaoSchedule
  title?: string
  className?: string
}

export function SelectionScheduleCard({
  schedule,
  title = 'Dados da prova',
  className,
}: SelectionScheduleCardProps) {
  const hasDates = schedule.datas.length > 0

  return (
    <section className={cn('rounded-lg border bg-muted/30 p-4', className)} aria-label={title}>
      <h4 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </h4>

      <div className="space-y-2 text-base">
        {hasDates ? (
          schedule.datas.map((slot) => (
            <div key={`${slot.data}-${slot.horario}`} className="grid gap-2 sm:grid-cols-2">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <time dateTime={slot.data}>{formatDateLongUTC(slot.data)}</time>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <time dateTime={slot.horario}>{slot.horario}</time>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-wrap items-start gap-2 text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Data e horário ainda não foram definidos pelo professor.</span>
          </div>
        )}

        <div
          className={cn(
            'flex items-start gap-2 rounded-md px-3 py-2',
            schedule.local
              ? 'bg-background'
              : 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
          )}
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{schedule.local || 'Local ainda não informado pelo professor.'}</span>
        </div>
      </div>
    </section>
  )
}
