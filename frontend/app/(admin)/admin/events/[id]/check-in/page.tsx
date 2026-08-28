'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import QrCheckInScanner from '../../../../../../components/admin/QrCheckInScanner'
import LoadingState from '../../../../../../components/LoadingState'
import ErrorState from '../../../../../../components/ErrorState'
import { getEventById } from '../../../../../../lib/events'
import { Event } from '../../../../../../lib/types'
import { getCurrentUserId, requireAdmin } from '../../../../../../lib/auth-guard'

export default function EventCheckInPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getCurrentUserId()
    if (!userId) {
      router.push('/login')
      return
    }

    if (!requireAdmin(router)) {
      return
    }

    loadEvent()
  }, [eventId, router])

  async function loadEvent() {
    setLoading(true)
    try {
      const eventData = await getEventById(eventId)
      if (!eventData) {
        setError('Evento não encontrado')
        return
      }
      setEvent(eventData)
    } catch {
      setError('Erro ao carregar evento')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error || !event) return <ErrorState message={error || 'Evento não encontrado'} onRetry={loadEvent} />

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center px-4 py-6 pb-safe sm:px-6 lg:min-h-screen lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <Link
          href={`/admin/dashboard?eventId=${eventId}`}
          className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Voltar ao dashboard do evento
        </Link>

        <div className="mb-6 text-center sm:text-left">
          <h1 className="line-clamp-3 break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Check-in — {event.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Leia o QR code do participante para registrar a presença
          </p>
        </div>

        <QrCheckInScanner eventId={eventId} centered />
      </div>
    </div>
  )
}
