import { Section, Text } from '@react-email/components'
import { colors } from './BaseLayout'

type InfoBoxVariant = 'warning' | 'info' | 'success' | 'error'

interface InfoBoxProps {
  variant?: InfoBoxVariant
  title?: string
  children: React.ReactNode
}

const variantStyles: Record<
  InfoBoxVariant,
  { bg: string; border: string; titleColor?: string }
> = {
  warning: {
    bg: colors.warningBg,
    border: colors.warning,
  },
  info: {
    bg: colors.infoBg,
    border: colors.info,
  },
  success: {
    bg: '#e8f5e9',
    border: colors.success,
  },
  error: {
    bg: '#ffebee',
    border: colors.error,
  },
}

export function InfoBox({ variant = 'info', title, children }: InfoBoxProps) {
  const style = variantStyles[variant]

  return (
    <Section
      style={{
        ...boxStyle,
        backgroundColor: style.bg,
        borderLeftColor: style.border,
      }}
    >
      {title && <Text style={titleStyle}>{title}</Text>}
      {children}
    </Section>
  )
}

const boxStyle: React.CSSProperties = {
  padding: '15px',
  margin: '20px 0',
  borderLeft: '4px solid',
  borderRadius: '0 4px 4px 0',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontWeight: 'bold',
  fontSize: '16px',
}
