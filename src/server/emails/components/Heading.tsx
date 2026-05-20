import { Heading as EmailHeading } from '@react-email/components'

interface HeadingProps {
  children: React.ReactNode
  color?: string
}

export function Heading({ children, color = '#1a365d' }: HeadingProps) {
  return <EmailHeading style={{ ...headingStyle, color }}>{children}</EmailHeading>
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: '20px',
}
