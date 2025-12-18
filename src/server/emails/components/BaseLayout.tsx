import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const colors = {
  primary: '#0066cc',
  warning: '#ffc107',
  warningBg: '#fff3cd',
  info: '#0066cc',
  infoBg: '#e6f3ff',
  success: '#4caf50',
  error: '#f44336',
  admin: '#673ab7',
  text: '#333333',
  muted: '#666666',
  border: '#eeeeee',
  background: '#f4f4f4',
}

interface BaseLayoutProps {
  preview?: string
  accentColor?: string
  children: React.ReactNode
}

export function BaseLayout({
  preview,
  accentColor = colors.primary,
  children,
}: BaseLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={{ ...containerStyle, borderTopColor: accentColor }}>
          <Section style={headerStyle}>
            <Text style={{ ...logoStyle, color: accentColor }}>
              Sistema de Monitoria IC - UFBA
            </Text>
          </Section>

          <Section style={contentStyle}>{children}</Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Esta é uma mensagem automática. Por favor, não responda diretamente
              a este email.
            </Text>
            <Text style={footerTextStyle}>
              Instituto de Computação - Universidade Federal da Bahia
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  margin: 0,
  padding: '20px',
  backgroundColor: colors.background,
  color: colors.text,
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '20px auto',
  backgroundColor: '#ffffff',
  padding: '25px',
  borderRadius: '8px',
  borderTop: '5px solid',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  paddingBottom: '15px',
  marginBottom: '25px',
  borderBottom: `1px solid ${colors.border}`,
}

const logoStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  margin: 0,
}

const contentStyle: React.CSSProperties = {
  lineHeight: '1.65',
  fontSize: '15px',
}

const footerStyle: React.CSSProperties = {
  marginTop: '30px',
  paddingTop: '15px',
  borderTop: `1px solid ${colors.border}`,
  textAlign: 'center' as const,
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: colors.muted,
  margin: '5px 0',
}
