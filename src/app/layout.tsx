import { Providers } from "@/components/providers"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Monitoria UFBA",
  description: "Sistema de gerenciamento de monitoria da Universidade Federal da Bahia",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
