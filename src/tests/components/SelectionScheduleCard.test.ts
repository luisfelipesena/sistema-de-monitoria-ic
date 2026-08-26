import { SelectionScheduleCard } from '@/components/features/student/SelectionScheduleCard'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

describe('SelectionScheduleCard', () => {
  it('renders date, time and location with semantic time values', () => {
    const html = renderToStaticMarkup(
      createElement(SelectionScheduleCard, {
        schedule: { datas: [{ data: '2026-08-26', horario: '14:00' }], local: 'Sala 123, PAF I' },
      })
    )

    expect(html).toContain('26 de agosto de 2026')
    expect(html).toContain('dateTime="2026-08-26"')
    expect(html).toContain('Sala 123, PAF I')
  })

  it('renders explicit pending states instead of blank content', () => {
    const html = renderToStaticMarkup(createElement(SelectionScheduleCard, { schedule: { datas: [], local: null } }))

    expect(html).toContain('Data e horário ainda não foram definidos pelo professor.')
    expect(html).toContain('Local ainda não informado pelo professor.')
  })
})
