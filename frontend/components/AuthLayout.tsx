import React from 'react'
import { CalendarCheck2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[100dvh] flex-col items-center overflow-x-clip bg-background',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] max-h-80 bg-gradient-to-b from-primary/10 to-transparent sm:max-h-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[min(28rem,88vw)] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:-top-28 sm:h-64 sm:w-[min(32rem,90vw)]"
      />

      <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12">
        <header className="mb-6 flex w-full max-w-[26rem] flex-col items-center gap-3 text-center sm:mb-8 sm:max-w-md md:max-w-lg">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-14">
            <CalendarCheck2 className="size-6 sm:size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Event-Check
            </h1>
            <p className="mx-auto mt-1.5 max-w-[20rem] text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-2 sm:max-w-xs sm:text-base">
              Gerencie eventos e inscrições em um só lugar.
            </p>
          </div>
        </header>

        <main className="w-full min-w-0 max-w-[26rem] sm:max-w-md md:max-w-lg">{children}</main>
      </div>
    </div>
  )
}
