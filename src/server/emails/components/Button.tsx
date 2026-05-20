import { Button as EmailButton } from '@react-email/components'
import { colors } from './BaseLayout'

interface ButtonProps {
  href: string
  children: React.ReactNode
  color?: string
}

export function Button({ href, children, color = colors.primary }: ButtonProps) {
  return (
    <EmailButton href={href} style={{ ...buttonStyle, backgroundColor: color }}>
      {children}
    </EmailButton>
  )
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  color: '#ffffff',
  marginTop: '15px',
}
