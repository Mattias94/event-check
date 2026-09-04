'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { CalendarDays, Clock, MapPin, Tag, Users } from 'lucide-react'
import {
  getEventById,
  enrollUser,
  unenrollUser,
  isUserEnrolled,
  getUserEnrollmentsWithQr,
} from '../../../../lib/events'
import { Event } from '../../../../lib/types'
import { getCurrentUserId } from '../../../../lib/auth-guard'
import EventCoverImage from '../../../../components/EventCoverImage'
import EventLocationMap from '../../../../components/EventLocationMap'
import EventEnrollmentFooter from '../../../../components/EventEnrollmentFooter'
import PageBackButton from '../../../../components/PageBackButton'
import { FormAlert } from '../../../../components/ui/FormAlert'
import LoadingState from '../../../../components/LoadingState'
import ErrorState from '../../../../components/ErrorState'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { Progress } from '../../../../components/ui/Progress'
import { cn } from '../../../../lib/utils'

export default function EventDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EventDetailContent />
    </Suspense>
  )
}

function EventDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params.id as string
  const from = searchParams.get('from')

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [enrollNotice, setEnrollNotice] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const currentUserId = getCurrentUserId()
  const hasLoadedRef = useRef(false)

  const backHref = from === 'dashboard' ? '/dashboard' : '/events'
  const backLabel =
    from === 'dashboard' ? 'Voltar para meus eventos' : 'Voltar para descobrir eventos'

  const loadEnrollmentQr = useCallback(async (userId: string, enrolled: boolean) => {
    if (!enrolled) {
      setQrDataUrl(null)
      return
    }

    setQrLoading(true)
    try {
      const enrollments = await getUserEnrollmentsWithQr(userId)
      const match = enrollments.find((item) => item.eventId === eventId)
      setQrDataUrl(match?.qrDataUrl ?? null)
    } catch {
      setQrDataUrl(null)
    } finally {
      setQrLoading(false)
    }
  }, [eventId])

  const loadData = useCallback(async () => {
    const isInitialLoad = !hasLoadedRef.current
    if (isInitialLoad) setLoading(true)
    setLoadError(null)
    try {
      const [eventData, enrolled] = await Promise.all([
        getEventById(eventId),
        currentUserId ? isUserEnrolled(currentUserId, eventId) : Promise.resolve(false),
      ])

      if (!eventData) {
        setEvent(null)
        setLoadError('Evento não encontrado')
        return
      }
      setEvent(eventData)
      setIsEnrolled(enrolled)
      hasLoadedRef.current = true

      if (currentUserId) {
        await loadEnrollmentQr(currentUserId, enrolled)
      }
    } catch {
      setEvent(null)
      setLoadError('Erro ao carregar evento. Verifique sua conexão e tente novamente.')
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }, [currentUserId, eventId, loadEnrollmentQr])

  useEffect(() => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    loadData()
  }, [currentUserId, router, loadData])

  async function handleEnroll() {
    if (!currentUserId) return
    setEnrolling(true)
    setActionError(null)
    setEnrollNotice(null)
    try {
      const result = await enrollUser(currentUserId, eventId)
      if (result.success) {
        setIsEnrolled(true)
        setEnrollNotice(
          result.emailSent
            ? 'Inscrição confirmada! Enviamos o QR code de check-in para seu e-mail.'
            : 'Inscrição confirmada! Seu QR code também está disponível abaixo.',
        )
        await loadData()
      } else {
        setActionError(result.error || 'Não foi possível concluir a inscrição.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  async function handleUnenroll() {
    if (!currentUserId) return
    if (!confirm('Cancelar a inscrição?')) return
    setEnrolling(true)
    setActionError(null)
    try {
      const result = await unenrollUser(currentUserId, eventId)
      if (result.success) {
        setIsEnrolled(false)
        setQrDataUrl(null)
        await loadData()
      } else {
        setActionError(result.error || 'Não foi possível cancelar a inscrição.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <LoadingState />
  if (loadError || !event) {
    return (
      <ErrorState
        message={loadError || 'Evento não encontrado'}
        onRetry={loadError?.includes('conexão') ? loadData : () => router.push('/events')}
      />
    )
  }

  const avail = Math.max(0, event.capacity - event.currentEnrollments)
  const isAlmostFull = avail <= Math.ceil(event.capacity * 0.2)
  const canEnroll = event.status === 'active' && avail > 0
  const statusVariant =
    event.status === 'active' ? ('success' as const)
    : event.status === 'cancelled' ? ('destructive' as const)
    : ('secondary' as const)
  const statusLabel =
    event.status === 'active' ? 'Ativo' : event.status === 'cancelled' ? 'Cancelado' : 'Finalizado'

  const details = [
    { icon: CalendarDays, label: 'Data', value: new Date(event.date).toLocaleDateString('pt-BR') },
    { icon: Clock, label: 'Hora', value: event.time },
    { icon: Users, label: 'Capacidade', value: String(event.capacity) },
  ]

  const mobileContentPadding = isEnrolled
    ? 'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:pb-8'
    : canEnroll
      ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8'
      : 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-8'

  return (
    <div className="min-h-full bg-background">
      <div className={cn('mx-auto max-w-7xl px-4 pt-4 sm:px-5 sm:pt-6 md:px-6 md:pt-8', mobileContentPadding)}>
        <div className="mb-4 md:mb-5">
          <PageBackButton href={backHref} label={backLabel} />
        </div>

        {enrollNotice && (
          <FormAlert variant="success" className="mb-4">
            {enrollNotice}
          </FormAlert>
        )}

        <div className="mb-6 md:mb-8">
          {event.coverImageUrl && (
            <EventCoverImage src={event.coverImageUrl} className="mb-4 rounded-lg" />
          )}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Tag aria-hidden="true" />
              {event.category}
            </Badge>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <h1 className="break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {event.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="space-y-6 p-4 pt-4 md:p-6 md:pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {event.description}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-3 md:p-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
                        <p className="truncate text-sm font-semibold text-foreground md:text-base">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground md:text-base">
                    <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                    Localização
                  </h2>
                  <EventLocationMap
                    location={event.location}
                    latitude={event.latitude}
                    longitude={event.longitude}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground md:text-base">
                      <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                      Inscritos
                    </h2>
                    <span className={`text-sm font-medium ${isAlmostFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {event.currentEnrollments}/{event.capacity}
                    </span>
                  </div>
                  <Progress
                    value={event.currentEnrollments}
                    max={event.capacity}
                    className="h-3"
                    indicatorClassName={isAlmostFull ? 'bg-destructive' : undefined}
                    aria-label="Ocupação de vagas"
                  />
                  <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                    {avail} vaga{avail !== 1 ? 's' : ''} restante{avail !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <EventEnrollmentFooter
            isEnrolled={isEnrolled}
            canEnroll={canEnroll}
            enrolling={enrolling}
            actionError={actionError}
            qrDataUrl={qrDataUrl}
            qrLoading={qrLoading}
            eventTitle={event.title}
            eventStatus={event.status}
            onEnroll={handleEnroll}
            onUnenroll={handleUnenroll}
          />
        </div>
      </div>
    </div>
  )
}
