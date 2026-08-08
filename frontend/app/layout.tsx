import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Event-Check',
  description: 'Event management'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
