'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import QrCheckInScanner from '../../../../../../components/admin/QrCheckInScanner'
import LoadingState from '../../../../../../components/LoadingState'
import ErrorState from '../../../../../../components/ErrorState'
import Button from '../../../../../../components/ui/Button'
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
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-6 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/events')}
        className="-ml-2 mb-4 h-11 text-muted-foreground hover:text-foreground md:h-9"
      >
        <ArrowLeft aria-hidden="true" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Check-in — {event.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leia o QR code do participante para registrar a presença
        </p>
      </div>

      <QrCheckInScanner eventId={eventId} />
    </div>
  )
}
