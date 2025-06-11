import './globals.css';
import { Providers } from './providers';
import React from 'react';

export const metadata = {
  title: 'Monitoria IC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}