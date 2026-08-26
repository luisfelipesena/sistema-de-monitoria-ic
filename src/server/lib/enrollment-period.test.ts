import {
  PERIODO_INSCRICAO_STATUS_ATIVO,
  PERIODO_INSCRICAO_STATUS_FINALIZADO,
  PERIODO_INSCRICAO_STATUS_FUTURO,
} from '@/types/schemas'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import {
  activeEnrollmentPeriodCondition,
  endedEnrollmentPeriodCondition,
  enrollmentPeriodsEndingSoonCondition,
  getEnrollmentPeriodStatus,
  getInstitutionDate,
} from './enrollment-period'

const period = {
  dataInicio: new Date('2026-08-20T00:00:00.000Z'),
  dataFim: new Date('2026-08-25T00:00:00.000Z'),
}

describe('enrollment period policy', () => {
  it('uses the civil date in Salvador instead of the UTC date', () => {
    expect(getInstitutionDate(new Date('2026-08-26T00:28:00.000Z')).toISOString()).toBe('2026-08-25T00:00:00.000Z')
  })

  it('keeps registration open through 23:59:59 in Salvador on the final date', () => {
    expect(getEnrollmentPeriodStatus(period, new Date('2026-08-26T02:59:59.999Z'))).toBe(PERIODO_INSCRICAO_STATUS_ATIVO)
  })

  it('closes registration at midnight in Salvador after the final date', () => {
    expect(getEnrollmentPeriodStatus(period, new Date('2026-08-26T03:00:00.000Z'))).toBe(
      PERIODO_INSCRICAO_STATUS_FINALIZADO
    )
  })

  it('keeps a future period closed until its first civil day in Salvador', () => {
    expect(getEnrollmentPeriodStatus(period, new Date('2026-08-20T02:59:59.999Z'))).toBe(
      PERIODO_INSCRICAO_STATUS_FUTURO
    )
    expect(getEnrollmentPeriodStatus(period, new Date('2026-08-20T03:00:00.000Z'))).toBe(PERIODO_INSCRICAO_STATUS_ATIVO)
  })

  it('binds the Salvador date into active-period database queries', () => {
    const query = new PgDialect().sqlToQuery(activeEnrollmentPeriodCondition(new Date('2026-08-26T00:28:00.000Z')))

    expect(query.params).toEqual(['2026-08-25T00:00:00.000Z', '2026-08-25T00:00:00.000Z'])
  })

  it('treats the final date as active in reminders and ended-period queries', () => {
    const dialect = new PgDialect()
    const endedQuery = dialect.sqlToQuery(endedEnrollmentPeriodCondition(new Date('2026-08-26T00:28:00.000Z')))
    const reminderQuery = dialect.sqlToQuery(
      enrollmentPeriodsEndingSoonCondition(2, new Date('2026-08-26T00:28:00.000Z'))
    )

    expect(endedQuery.sql).toContain('"data_fim" < $1')
    expect(endedQuery.params).toEqual(['2026-08-25T00:00:00.000Z'])
    expect(reminderQuery.params).toEqual(['2026-08-25T00:00:00.000Z', '2026-08-27T00:00:00.000Z'])
  })
})
