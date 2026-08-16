'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  Pencil,
  Tag,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import LoadingState from '../../../../components/LoadingState'
import ErrorState from '../../../../components/ErrorState'
import EmptyState from '../../../../components/EmptyState'
import { Card } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import Button from '../../../../components/ui/Button'
import { Progress } from '../../../../components/ui/Progress'
import { getEventsByAdmin, deleteEvent, cancelEvent } from '../../../../lib/events'
import { getCurrentUserId, requireAdmin } from '../../../../lib/auth-guard'
import { Event } from '../../../../lib/types'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

function StatusBadge({ status }: { status: Event['status'] }) {
  if (status === 'active') return <Badge variant="success">Ativo</Badge>
  if (status === 'cancelled') return <Badge variant="destructive">Cancelado</Badge>
  return <Badge variant="secondary">Finalizado</Badge>
}

export default function AdminEventListPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const userId = getCurrentUserId()
      if (userId) {
        const adminEvents = await getEventsByAdmin(userId)
        setEvents(adminEvents)
      }
    } catch (err) {
      setError('Erro ao carregar eventos. Tente recarregar a página.')
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  async function handleDelete(eventId: string, eventTitle: string) {
    const confirmed = confirm(
      `Tem certeza que deseja deletar o evento "${eventTitle}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    try {
      const result = await deleteEvent(eventId)
      if (!result.success) {
        showToast(result.error || 'Erro ao deletar evento', 'error')
        return
      }

      setEvents(events.filter(e => e.id !== eventId))
      showToast(`Evento "${eventTitle}" deletado com sucesso`, 'success')
    } catch (err) {
      showToast('Erro ao deletar evento. Tente novamente.', 'error')
      console.error('Erro ao deletar evento:', err)
    }
  }

  async function handleCancel(eventId: string, eventTitle: string) {
    const event = events.find(e => e.id === eventId)
    const inscritosCount = event?.currentEnrollments || 0

    const confirmed = confirm(
      `Tem certeza que deseja CANCELAR "${eventTitle}"?\n\n${inscritosCount} inscrito(s) será(ão) notificado(s).`
    )

    if (!confirmed) return

    try {
      const updated = await cancelEvent(eventId)
      if (updated) {
        setEvents(events.map(e => (e.id === eventId ? updated : e)))
        showToast(`Evento cancelado. ${inscritosCount} inscrito(s) notificado(s).`, 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao cancelar evento', 'error')
      console.error('Erro ao cancelar evento:', err)
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadEvents} />

  const stats = [
    {
      label: 'Total de Eventos',
      value: events.length,
      icon: CalendarDays,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Ativos',
      value: events.filter(e => e.status === 'active').length,
      icon: CheckCircle2,
      iconClass: 'bg-success/10 text-success',
    },
    {
      label: 'Total de Inscritos',
      value: events.reduce((sum, e) => sum + e.currentEnrollments, 0),
      icon: Users,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Cancelados',
      value: events.filter(e => e.status === 'cancelled').length,
      icon: XCircle,
      iconClass: 'bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* Toast Container */}
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            className="flex max-w-xs animate-fade-in items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Cabeçalho da página */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Meus Eventos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Gerencie e crie seus eventos
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          message="Você ainda não criou nenhum evento"
          actionButton={{
            label: 'Criar Seu Primeiro Evento',
            onClick: () => router.push('/admin/events/create'),
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {stats.map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4 md:p-5">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.iconClass}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              )
            })}
          </div>

          {/* Lista de eventos */}
          <div className="grid grid-cols-1 gap-4">
            {events.map(event => {
              const ratio = event.capacity > 0 ? event.currentEnrollments / event.capacity : 0
              return (
                <Card key={event.id} className="p-4 transition-shadow hover:shadow-md md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* Informações do evento */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                          {event.title}
                        </h3>
                        <StatusBadge status={event.status} />
                      </div>

                      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex flex-wrap items-center gap-2">
                          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                          <span className="whitespace-nowrap">
                            {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{event.location}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Tag className="size-4 shrink-0" aria-hidden="true" />
                          {event.category}
                        </p>
                      </div>
                    </div>

                    {/* Capacidade */}
                    <div className="w-full space-y-2 lg:w-56 lg:shrink-0 lg:pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Inscritos</span>
                        <span className="font-medium text-foreground">
                          {event.currentEnrollments} / {event.capacity}
                        </span>
                      </div>
                      <Progress
                        value={event.currentEnrollments}
                        max={event.capacity}
                        indicatorClassName={
                          ratio > 0.8
                            ? 'bg-destructive'
                            : ratio > 0.5
                            ? 'bg-warning'
                            : 'bg-success'
                        }
                      />
                    </div>

                    {/* Ações */}
                    <div className="grid w-full grid-cols-2 gap-2 lg:w-44 lg:shrink-0 lg:grid-cols-1">
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/admin/dashboard?eventId=${event.id}`)}
                        className="justify-start"
                      >
                        <LayoutDashboard aria-hidden="true" />
                        Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className="justify-start"
                      >
                        <Pencil aria-hidden="true" />
                        Editar
                      </Button>

                      {event.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(event.id, event.title)}
                          className="justify-start text-warning hover:text-warning"
                        >
                          <XCircle aria-hidden="true" />
                          Cancelar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={event.currentEnrollments > 0}
                        className="justify-start text-destructive hover:text-destructive"
                        title={
                          event.currentEnrollments > 0
                            ? `${event.currentEnrollments} inscrito(s). Cancele primeiro.`
                            : 'Deletar evento'
                        }
                      >
                        <Trash2 aria-hidden="true" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
