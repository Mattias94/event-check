'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, QrCode, X } from 'lucide-react'
import { cn } from '../lib/utils'

export interface EnrollmentQrCodeProps {
  qrDataUrl?: string | null
  eventTitle?: string
  compact?: boolean
  loading?: boolean
  className?: string
}

export default function EnrollmentQrCode({
  qrDataUrl,
  eventTitle,
  compact = false,
  loading = false,
  className,
}: EnrollmentQrCodeProps) {
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!expanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [expanded])

  if (loading) {
    return (
      <div
        className={cn(
          'flex animate-pulse items-center justify-center rounded-lg border bg-muted',
          compact ? 'size-24 sm:size-20 md:size-24' : 'size-32 md:size-36',
          className,
        )}
        aria-hidden="true"
      />
    )
  }

  if (!qrDataUrl) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-lg border bg-muted/50 px-2 text-center text-muted-foreground',
          compact ? 'size-24 sm:size-20 md:size-24' : 'size-32 md:size-36',
          className,
        )}
      >
        <QrCode className={cn(compact ? 'size-8 md:size-10' : 'size-10 md:size-12')} aria-hidden="true" />
        <span className="text-[10px] font-medium leading-tight">QR indisponível</span>
      </div>
    )
  }

  const previewSize = compact ? 'size-24 sm:size-20 md:size-24' : 'size-32 md:size-36'

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setExpanded(true)
          }}
          aria-label="Ampliar QR code para check-in"
          title="Toque para ampliar o QR code"
          className={cn(
            'group relative shrink-0 overflow-hidden rounded-lg border-2 border-border bg-white p-1.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            previewSize,
            className,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="" className="size-full object-contain" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/75 py-0.5 text-[9px] font-medium text-background opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100 md:text-[10px]">
            <Maximize2 className="size-3" aria-hidden="true" />
            Ampliar
          </span>
        </button>
        <span className="text-[10px] text-muted-foreground sm:hidden">Toque para ampliar</span>
      </div>

      {mounted &&
        expanded &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[140] bg-black/90 backdrop-blur-sm"
              onMouseDown={() => setExpanded(false)}
            />
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onMouseDown={(event) => event.stopPropagation()}
                className="relative flex max-h-[92dvh] w-full max-w-sm flex-col items-center overflow-y-auto rounded-2xl border border-white/10 bg-white px-4 py-5 shadow-2xl sm:max-w-md sm:px-8 sm:py-8"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Fechar"
                  className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>

                <p id={titleId} className="sr-only">
                  QR Code de check-in{eventTitle ? `: ${eventTitle}` : ''}
                </p>

                {eventTitle && (
                  <p className="mb-4 max-w-full truncate px-8 text-center text-xs font-medium text-muted-foreground sm:text-sm">
                    {eventTitle}
                  </p>
                )}

                <div className="rounded-2xl border-[3px] border-primary bg-white p-3 ring-4 ring-primary/10 sm:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR code de check-in do evento"
                    className="h-auto max-h-[min(50dvh,300px)] w-auto max-w-[min(72vw,280px)] object-contain"
                  />
                </div>

                <p className="mt-4 max-w-xs text-center text-sm font-medium text-foreground">
                  Apresente ao administrador para o check-in
                </p>
                <p className="mt-1 pb-safe text-center text-xs text-muted-foreground">
                  Aumente o brilho da tela para facilitar a leitura
                </p>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
