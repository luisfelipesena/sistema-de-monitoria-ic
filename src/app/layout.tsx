import { Providers } from "@/components/providers"
import type { Metadata } from "next"
import Script from "next/script"
import { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema de Monitoria UFBA",
  description: "Sistema de gerenciamento de monitoria da Universidade Federal da Bahia",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
