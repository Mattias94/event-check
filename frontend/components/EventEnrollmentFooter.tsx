'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import EnrollmentQrCode from './EnrollmentQrCode'
import Button from './ui/Button'
import { cn } from '../lib/utils'

export interface EventEnrollmentFooterProps {
  isEnrolled: boolean
  canEnroll: boolean
  enrolling: boolean
  actionError: string | null
  qrDataUrl: string | null
  qrLoading: boolean
  eventTitle: string
  eventStatus: string
  onEnroll: () => void
  onUnenroll: () => void
}

export default function EventEnrollmentFooter({
  isEnrolled,
  canEnroll,
  enrolling,
  actionError,
  qrDataUrl,
  qrLoading,
  eventTitle,
  eventStatus,
  onEnroll,
  onUnenroll,
}: EventEnrollmentFooterProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isEnrolled) setMobileOpen(false)
  }, [isEnrolled])

  const unavailableMessage =
    eventStatus !== 'active'
      ? 'Inscrições indisponíveis para este evento.'
      : 'Todas as vagas foram preenchidas.'

  /** Reserva espaço no fluxo da página para a barra fixa mobile (evita conteúdo oculto). */
  const mobileSpacerClass = isEnrolled
    ? 'h-[5.5rem]'
    : canEnroll
      ? 'h-[5.75rem]'
      : 'h-[7.5rem]'

  const enrolledPanel = (
    <>
      <div className="mb-4 flex flex-col items-center gap-3">
        <EnrollmentQrCode
          qrDataUrl={qrDataUrl}
          eventTitle={eventTitle}
          loading={qrLoading}
        />
        <div className="min-w-0 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
            <p className="text-sm font-medium text-success md:text-base">Você está inscrito</p>
          </div>
          <p className="text-xs text-muted-foreground md:text-sm">
            Toque no QR code para ampliar e apresentar ao administrador no check-in.
          </p>
        </div>
      </div>
      <Button variant="destructive" className="w-full" onClick={onUnenroll} loading={enrolling}>
        {enrolling ? 'Processando...' : 'Cancelar inscrição'}
      </Button>
    </>
  )

  return (
    <>
      {/* Mobile — barra de acesso ao QR (colapsável) */}
      {isEnrolled && (
        <div className="lg:hidden">
          {!mobileOpen ? (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-expanded={false}
              aria-controls="event-mobile-qr-panel"
              className="fixed inset-x-0 bottom-0 z-30 min-h-[4.5rem] border-t-2 border-primary bg-primary/10 px-4 py-3 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors active:bg-primary/15"
            >
              <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <ChevronUp className="size-5 animate-bounce" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Seu QR Code de check-in</p>
                    <p className="text-xs text-muted-foreground">Toque para abrir — conteúdo oculto abaixo</p>
                  </div>
                </div>
                {qrDataUrl && (
                  <div className="size-11 shrink-0 overflow-hidden rounded-md border-2 border-primary/40 bg-white p-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="" className="size-full object-contain" />
                  </div>
                )}
              </div>
            </button>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setMobileOpen(false)}
              />
              <div
                id="event-mobile-qr-panel"
                role="region"
                aria-label="QR code de check-in"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t-2 border-primary bg-background p-4 pb-safe shadow-2xl"
              >
                <div className="mx-auto mb-4 flex max-w-lg items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Check-in do evento</p>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    aria-label="Recolher painel"
                  >
                    <ChevronDown className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mx-auto max-w-lg">
                  {actionError && (
                    <p role="alert" className="mb-3 text-sm text-destructive">{actionError}</p>
                  )}
                  {enrolledPanel}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile — inscrição / indisponível (sem QR) */}
      {!isEnrolled && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-4 pb-safe backdrop-blur lg:hidden">
          <div className="mx-auto max-w-lg">
            {actionError && (
              <p role="alert" className="mb-3 text-sm text-destructive">{actionError}</p>
            )}
            {canEnroll ? (
              <Button size="lg" className="w-full" onClick={onEnroll} loading={enrolling}>
                {enrolling ? 'Processando...' : 'Inscrever-se'}
              </Button>
            ) : (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                {unavailableMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop — painel lateral fixo */}
      <aside className="hidden lg:block lg:self-start">
        <div className="sticky top-6 rounded-lg border bg-card p-6 shadow-sm">
          {actionError && (
            <p role="alert" className="mb-3 text-sm text-destructive">{actionError}</p>
          )}
          {isEnrolled ? (
            enrolledPanel
          ) : canEnroll ? (
            <Button size="lg" className="w-full" onClick={onEnroll} loading={enrolling}>
              {enrolling ? 'Processando...' : 'Inscrever-se'}
            </Button>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              {unavailableMessage}
            </div>
          )}
        </div>
      </aside>

      {/* Espaçador mobile — altura da barra fixa inferior */}
      <div
        className={cn('shrink-0 lg:hidden', mobileSpacerClass)}
        aria-hidden="true"
      />
    </>
  )
}
