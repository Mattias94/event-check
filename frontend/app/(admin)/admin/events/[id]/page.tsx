'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CalendarPlus, Trash2, UserCheck, Users, XCircle } from 'lucide-react'
import AdminEventForm from '../../../../../components/admin/AdminEventForm'
import QrCheckInScanner from '../../../../../components/admin/QrCheckInScanner'
import LoadingState from '../../../../../components/LoadingState'
import ErrorState from '../../../../../components/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/Card'
import { Badge } from '../../../../../components/ui/Badge'
import Button from '../../../../../components/ui/Button'
import { Progress } from '../../../../../components/ui/Progress'
import { getEventById, updateEvent, getEnrollments, deleteEvent, cancelEvent } from '../../../../../lib/events'
import { Event, EnrollmentRecord } from '../../../../../lib/types'
import { EventCreationData } from '../../../../../lib/schemas'
import { getCurrentUserId, requireAdmin } from '../../../../../lib/auth-guard'

function StatusBadge({ status }: { status: Event['status'] }) {
  if (status === 'active') return <Badge variant="success">Ativo</Badge>
  if (status === 'cancelled') return <Badge variant="destructive">Cancelado</Badge>
  return <Badge variant="secondary">Finalizado</Badge>
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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
      const enrollmentData = await getEnrollments(eventId)
      setEnrollments(enrollmentData)
    } catch {
      setError('Erro ao carregar evento')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(data: EventCreationData) {
    setSubmitError(null)
    try {
      const updated = await updateEvent(eventId, data)
      if (!updated) {
        setSubmitError('Erro ao atualizar evento')
        return
      }
      setEvent(updated)
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao atualizar evento')
    }
  }

  async function refreshEnrollments() {
    try {
      const enrollmentData = await getEnrollments(eventId)
      setEnrollments(enrollmentData)
      const eventData = await getEventById(eventId)
      if (eventData) setEvent(eventData)
    } catch {
      // mantém a lista atual se a atualização falhar
    }
  }

  async function handleCancel() {
    if (!event) return
    const confirmed = confirm(
      `Cancelar "${event.title}"?\n\n${event.currentEnrollments} inscrito(s) receberão e-mail de cancelamento.`,
    )
    if (!confirmed) return

    setActionLoading(true)
    try {
      const updated = await cancelEvent(eventId)
      if (updated) setEvent(updated)
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar evento')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    const confirmed = confirm(`Deletar "${event.title}"?\n\nEsta ação não pode ser desfeita.`)
    if (!confirmed) return

    setActionLoading(true)
    try {
      const result = await deleteEvent(eventId)
      if (!result.success) {
        alert(result.error || 'Erro ao deletar evento')
        return
      }
      router.push('/admin/events')
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar evento')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error || !event) return <ErrorState message={error || 'Evento não encontrado'} onRetry={loadEvent} />

  const isReadOnly = event.status !== 'active'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/events')}
        className="-ml-2 mb-4 h-11 text-muted-foreground hover:text-foreground md:h-9"
      >
        <ArrowLeft aria-hidden="true" />
        Voltar
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {event.title}
          </h1>
          <StatusBadge status={event.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {event.status === 'active' && (
            <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
              <XCircle aria-hidden="true" />
              Cancelar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={actionLoading || event.currentEnrollments > 0}
            className="text-destructive hover:text-destructive"
            title={
              event.currentEnrollments > 0
                ? `${event.currentEnrollments} inscrito(s). Cancele primeiro ou aguarde desinscrições.`
                : 'Deletar evento'
            }
          >
            <Trash2 aria-hidden="true" />
            Deletar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <AdminEventForm
            initialData={event}
            onSubmit={handleUpdate}
            error={submitError}
            readOnly={isReadOnly}
          />
        </div>

        <div className="space-y-4 md:space-y-6">
          <QrCheckInScanner eventId={eventId} onCheckInSuccess={refreshEnrollments} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" aria-hidden="true" />
                Inscritos ({enrollments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum inscrito ainda</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {enrollments.map(enrollment => (
                    <div key={enrollment.id} className="rounded-md bg-muted p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium text-foreground">
                          ID: {enrollment.userId}
                        </div>
                        {enrollment.checkedInAt ? (
                          <Badge variant="success">Check-in feito</Badge>
                        ) : (
                          <Badge variant="secondary">Aguardando</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Inscrito em {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                        {enrollment.checkedInAt &&
                          ` · Check-in em ${new Date(enrollment.checkedInAt).toLocaleString('pt-BR')}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={event.status} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <UserCheck className="size-4" aria-hidden="true" />
                    Capacidade
                  </span>
                  <span className="font-medium text-foreground">
                    {event.currentEnrollments} / {event.capacity}
                  </span>
                </div>
                <Progress value={event.currentEnrollments} max={event.capacity} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Vagas Disponíveis
                </span>
                <span className="font-medium text-foreground">
                  {Math.max(0, event.capacity - event.currentEnrollments)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
