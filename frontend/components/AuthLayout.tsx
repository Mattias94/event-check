import React from 'react'
import { CalendarCheck2 } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-10 md:py-12">
      {/* Fundo decorativo sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <CalendarCheck2 className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Event-Check</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie eventos e inscrições em um só lugar.
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
