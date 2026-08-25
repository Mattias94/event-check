'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, Tag, Users } from 'lucide-react'
import { getEventById, enrollUser, unenrollUser, isUserEnrolled } from '../../../lib/events'
import { Event } from '../../../lib/types'
import { getCurrentUserId } from '../../../lib/auth-guard'
import EventCoverImage from '../../../components/EventCoverImage'
import LoadingState from '../../../components/LoadingState'
import ErrorState from '../../../components/ErrorState'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Progress } from '../../../components/ui/Progress'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const currentUserId = getCurrentUserId()

  useEffect(() => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    loadData()
  }, [currentUserId, router, eventId])

  async function loadData() {
    setLoading(true)
    setLoadError(null)
    try {
      const eventData = await getEventById(eventId)
      if (!eventData) {
        setEvent(null)
        setLoadError('Evento não encontrado')
        return
      }
      setEvent(eventData)
      if (currentUserId) {
        setIsEnrolled(await isUserEnrolled(currentUserId, eventId))
      }
    } catch {
      setEvent(null)
      setLoadError('Erro ao carregar evento. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    if (!currentUserId) return
    setEnrolling(true)
    setActionError(null)
    try {
      const result = await enrollUser(currentUserId, eventId)
      if (result.success) {
        setIsEnrolled(true)
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
    { icon: MapPin, label: 'Local', value: event.location },
    { icon: Users, label: 'Capacidade', value: String(event.capacity) },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:h-16 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/events')}
            className="-ml-2 h-11 md:h-9"
          >
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-6 md:pt-8 lg:pb-8">
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

          <aside>
            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-4 backdrop-blur lg:sticky lg:top-24 lg:rounded-lg lg:border lg:bg-card lg:p-6 lg:shadow-sm">
              {actionError && (
                <p role="alert" className="mb-3 text-sm text-destructive">{actionError}</p>
              )}

              {isEnrolled ? (
                <>
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 p-3 lg:mb-4">
                    <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-success md:text-base">
                        Você está inscrito
                      </p>
                      <p className="mt-0.5 text-xs text-success/80">
                        Enviamos por e-mail o QR code para o check-in no dia do evento.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleUnenroll}
                    loading={enrolling}
                  >
                    {enrolling ? 'Processando...' : 'Cancelar inscrição'}
                  </Button>
                </>
              ) : canEnroll ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleEnroll}
                  loading={enrolling}
                >
                  {enrolling ? 'Processando...' : 'Inscrever-se'}
                </Button>
              ) : (
                <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                  {event.status !== 'active'
                    ? 'Inscrições indisponíveis para este evento.'
                    : 'Todas as vagas foram preenchidas.'}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
