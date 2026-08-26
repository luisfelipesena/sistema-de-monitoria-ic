import { Text } from '@react-email/components'
import type { SelecaoSchedule } from '@/types'
import { formatDateLongUTC } from '@/utils/date-utils'
import { BaseLayout, Button, Heading, InfoBox, colors } from '../../components'

interface SelectionScheduleUpdatedProps {
  studentName: string
  projectTitle: string
  schedule: SelecaoSchedule
  dashboardUrl: string
}

export function SelectionScheduleUpdated({
  studentName,
  projectTitle,
  schedule,
  dashboardUrl,
}: SelectionScheduleUpdatedProps) {
  return (
    <BaseLayout preview={`Dados da prova de monitoria: ${projectTitle}`} accentColor={colors.info}>
      <Heading color={colors.info}>Dados da prova de monitoria</Heading>

      <Text style={textStyle}>Olá, {studentName}.</Text>
      <Text style={textStyle}>Os dados da seleção do projeto "{projectTitle}" foram atualizados.</Text>

      <InfoBox title="Data, horário e local">
        {schedule.datas.map((slot) => (
          <Text key={`${slot.data}-${slot.horario}`} style={infoTextStyle}>
            {formatDateLongUTC(slot.data)}, às {slot.horario}
          </Text>
        ))}
        <Text style={infoTextStyle}>Local: {schedule.local || 'ainda não informado'}</Text>
      </InfoBox>

      <Button href={dashboardUrl} color={colors.info}>
        Consultar no sistema
      </Button>
    </BaseLayout>
  )
}

const textStyle: React.CSSProperties = {
  marginBottom: '15px',
}

const infoTextStyle: React.CSSProperties = {
  margin: '4px 0',
}
