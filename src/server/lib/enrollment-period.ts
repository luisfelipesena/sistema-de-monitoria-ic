import { periodoInscricaoTable } from '@/server/db/schema'
import {
  PERIODO_INSCRICAO_STATUS_ATIVO,
  PERIODO_INSCRICAO_STATUS_FINALIZADO,
  PERIODO_INSCRICAO_STATUS_FUTURO,
  type PeriodoInscricaoStatus,
} from '@/types/schemas'
import { gte, lt, lte, sql } from 'drizzle-orm'

export const INSTITUTION_TIME_ZONE = 'America/Bahia'

const institutionDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: INSTITUTION_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getInstitutionDate(now: Date = new Date()): Date {
  const parts = new Map(institutionDateFormatter.formatToParts(now).map(({ type, value }) => [type, value]))
  return new Date(Date.UTC(Number(parts.get('year')), Number(parts.get('month')) - 1, Number(parts.get('day'))))
}

export function getEnrollmentPeriodStatus(
  period: { dataInicio: Date; dataFim: Date },
  now: Date = new Date()
): PeriodoInscricaoStatus {
  const today = getInstitutionDate(now).getTime()
  const startsAt = period.dataInicio.getTime()
  const endsAt = period.dataFim.getTime()

  if (today < startsAt) return PERIODO_INSCRICAO_STATUS_FUTURO
  if (today > endsAt) return PERIODO_INSCRICAO_STATUS_FINALIZADO
  return PERIODO_INSCRICAO_STATUS_ATIVO
}

export function activeEnrollmentPeriodCondition(now: Date = new Date()) {
  const today = getInstitutionDate(now)
  return sql`(${lte(periodoInscricaoTable.dataInicio, today)} and ${gte(periodoInscricaoTable.dataFim, today)})`
}

export function endedEnrollmentPeriodCondition(now: Date = new Date()) {
  return lt(periodoInscricaoTable.dataFim, getInstitutionDate(now))
}

export function enrollmentPeriodsEndingSoonCondition(daysAhead: number, now: Date = new Date()) {
  const today = getInstitutionDate(now)
  const lastDay = new Date(today)
  lastDay.setUTCDate(lastDay.getUTCDate() + daysAhead)
  return sql`(${gte(periodoInscricaoTable.dataFim, today)} and ${lte(periodoInscricaoTable.dataFim, lastDay)})`
}
