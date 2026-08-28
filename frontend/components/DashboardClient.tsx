"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import EventLocationTrigger from './EventLocationTrigger'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  HeartPulse,
  Laptop,
  Pencil,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
  Phone,
} from 'lucide-react'
import { getEnrollmentsForUser, getUpcomingEvents, getUserEnrollmentsWithQr } from '../lib/events'
import { User, getUserById } from '../lib/auth'
import { getCurrentUser } from '../lib/auth-guard'
import { displayPhone } from '../lib/phone'
import { Event } from '../lib/types'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Skeleton } from './ui/Skeleton'
import ProfileEditDialog from './ProfileEditDialog'
import EnrollmentQrCode from './EnrollmentQrCode'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Tecnologia': Laptop,
  'Negócios': TrendingUp,
  'Educação': BookOpen,
  'Networking': Users,
  'Saúde': HeartPulse,
  'Outras': Sparkles,
}

function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] || Sparkles
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [historyEvents, setHistoryEvents] = useState<Event[]>([])
  const [newEvents, setNewEvents] = useState<Event[]>([])
  const [qrByEventId, setQrByEventId] = useState<Record<string, string>>({})
  const [qrLoading, setQrLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const parsedUser = getCurrentUser()
    if (!parsedUser) {
      router.push('/login')
      return
    }
    setUser(parsedUser)
    loadEvents(parsedUser.id)
    void getUserById(parsedUser.id).then((fresh) => {
      if (fresh) {
        setUser(fresh)
        localStorage.setItem('currentUser', JSON.stringify(fresh))
      }
    })
    setLoading(false)
  }, [router])

  function loadEvents(userId: string) {
    setQrLoading(true)
    Promise.all([getEnrollmentsForUser(userId), getUpcomingEvents(), getUserEnrollmentsWithQr(userId)])
      .then(([enrolledEvents, allUpcoming, enrollmentsWithQr]) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const isPast = (event: Event) => {
          const eventDate = new Date(event.date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate < today
        }

        const upcoming = enrolledEvents
          .filter((event) => event.status === 'active' && !isPast(event))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const history = enrolledEvents
          .filter((event) => event.status !== 'active' || isPast(event))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const enrolledIds = new Set(enrolledEvents.map((event) => event.id))
        const discover = allUpcoming
          .filter((event) => !enrolledIds.has(event.id))
          .slice(0, 2)

        setUpcomingEvents(upcoming)
        setHistoryEvents(history)
        setNewEvents(discover)
        setQrByEventId(
          Object.fromEntries(enrollmentsWithQr.map((item) => [item.eventId, item.qrDataUrl])),
        )
      })
      .catch(() => {
        setUpcomingEvents([])
        setHistoryEvents([])
        setNewEvents([])
        setQrByEventId({})
      })
      .finally(() => setQrLoading(false))
  }

  if (loading) {
    return (
      <div className="min-h-full bg-background px-4 py-6 sm:px-5 md:px-6 md:py-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const userName = user.name
  const userEmail = user.email
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-8">
        {/* Boas-vindas */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Aqui estão os seus eventos, {userName}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Próximos Eventos e Histórico */}
          <div className="space-y-6 md:space-y-8 lg:col-span-2">
            {/* Próximos Eventos */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">
                Meus Próximos Eventos
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="transition-all hover:border-primary/40 hover:shadow-md">
                      <CardContent className="p-4 pt-4 md:p-6 md:pt-6">
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-start gap-2">
                              <h3 className="min-w-0 flex-1 line-clamp-2 font-semibold leading-snug text-foreground">
                                {event.title}
                              </h3>
                              <Badge variant="success" className="shrink-0">
                                <CheckCircle2 aria-hidden="true" />
                                Inscrito
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                  <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                                  {new Date(event.date).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                                  {event.time}
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <EventLocationTrigger
                                  location={event.location}
                                  latitude={event.latitude}
                                  longitude={event.longitude}
                                  className="min-w-0 flex-1"
                                />
                              </p>
                            </div>
                          </div>
                          <div className="flex w-full flex-col items-center gap-3 md:w-auto md:items-end">
                            <EnrollmentQrCode
                              qrDataUrl={qrByEventId[event.id]}
                              eventTitle={event.title}
                              compact
                              loading={qrLoading}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-11 w-full md:h-9 md:w-auto"
                              onClick={() => router.push(`/events/${event.id}`)}
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center p-6 pt-6 text-center md:p-8 md:pt-8">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                      <CalendarDays className="size-7 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground md:text-base">
                      Você ainda não está inscrito em nenhum evento futuro.
                    </p>
                      <Button onClick={() => router.push('/events')} className="w-full sm:w-auto">
                        Descobrir Eventos
                        <ArrowRight aria-hidden="true" />
                      </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Histórico de Eventos */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">
                Histórico de Eventos
              </h2>
              {historyEvents.length > 0 ? (
                <Card>
                  <CardContent className="p-4 pt-4 md:p-6 md:pt-6">
                    <div className="divide-y divide-border">
                      {historyEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="flex min-h-11 w-full flex-col gap-2 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground md:text-base">
                              {event.title}
                            </p>
                            <p className="text-xs text-muted-foreground md:text-sm">
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span
                            className={`flex shrink-0 items-center gap-1.5 text-xs font-medium md:text-sm ${
                              event.status === 'cancelled' ? 'text-destructive' : 'text-success'
                            }`}
                          >
                            {event.status === 'cancelled' ? (
                              <XCircle className="size-4" aria-hidden="true" />
                            ) : (
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                            )}
                            {event.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 pt-6 text-center">
                    <p className="text-sm text-muted-foreground md:text-base">
                      Nenhum evento no seu histórico ainda.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Coluna Direita - Descobrir Eventos e Conta */}
          <div className="space-y-6 md:space-y-8">
            {/* Descobrir Eventos */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">
                Descubra Novos Eventos
              </h2>
              <div className="space-y-4">
                {newEvents.length > 0 ? (
                  <>
                    {newEvents.map((event) => {
                      const CategoryIcon = getCategoryIcon(event.category)
                      return (
                        <Card
                          key={event.id}
                          className="flex h-full cursor-pointer flex-col border-primary/30 ring-1 ring-primary/20 transition-all hover:border-primary/50 hover:shadow-md"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <CardContent className="flex flex-1 flex-col p-4 pt-4">
                            <div className="mb-3 flex h-24 w-full items-center justify-center rounded-md bg-secondary md:h-28">
                              <CategoryIcon className="size-10 text-primary md:size-12" aria-hidden="true" />
                            </div>
                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground md:text-base">
                              {event.title}
                            </h3>
                            <div className="mb-4 space-y-1.5 text-xs text-muted-foreground md:text-sm">
                              <p className="flex items-center gap-2">
                                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                                {new Date(event.date).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="flex items-center gap-2">
                                <Users className="size-4 shrink-0" aria-hidden="true" />
                                Vagas Restantes: {event.capacity - event.currentEnrollments}
                              </p>
                            </div>
                            <Button variant="secondary" size="sm" className="mt-auto h-11 w-full md:h-9">
                              Ver Detalhes
                              <ArrowRight aria-hidden="true" />
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                    <Button variant="outline" className="w-full" onClick={() => router.push('/events')}>
                      Descobrir mais eventos
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6 pt-6 text-center">
                      <p className="mb-4 text-sm text-muted-foreground md:text-base">
                        Novos eventos aparecerão em breve!
                      </p>
                      <Button onClick={() => router.push('/events')} className="w-full">
                        Ver Todos os Eventos
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Minha Conta */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">Minha Conta</h2>
              <Card>
                <CardContent className="p-4 pt-4 md:p-6 md:pt-6">
                  <div className="mb-4 flex items-center gap-3 md:gap-4">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover object-center ring-2 ring-border md:size-14"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground md:size-14 md:text-xl">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground md:text-base">
                        {userName}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground md:text-sm">{userEmail}</p>
                      {user.phone && (
                        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground md:text-sm">
                          <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                          {displayPhone(user.phone)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" className="h-11 w-full sm:h-10" onClick={() => setProfileOpen(true)}>
                    <Pencil aria-hidden="true" />
                    Editar
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

      {user && (
        <ProfileEditDialog
          user={user}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSaved={(updated) => setUser(updated)}
        />
      )}
    </div>
  )
}
