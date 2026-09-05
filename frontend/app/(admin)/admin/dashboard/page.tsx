'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getEventById, getEnrollments, getEventsByAdmin, unenrollUser } from '../../../../lib/events'
import { Event, EnrollmentWithUser } from '../../../../lib/types'
import { getCurrentUserId } from '../../../../lib/auth-guard'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  AlertCircle,
  CalendarDays,
  Clock,
  FileDown,
  QrCode,
  Search,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { Skeleton } from '../../../../components/ui/Skeleton'

interface EnrollmentWithDetails extends EnrollmentWithUser {}

// Paleta categórica fixa (validada para daltonismo)
const CHART_BLUE = '#2a78d6'
const CHART_ORANGE = '#eb6834'
const CHART_TEAL = '#1baf7a'

const AXIS_TICK = { fontSize: 12, fill: '#64748b' }

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
}

const CHART_TOOLTIP_ITEM: React.CSSProperties = {
  color: 'hsl(var(--foreground))',
}

const CHART_TOOLTIP_LABEL: React.CSSProperties = {
  color: 'hsl(var(--muted-foreground))',
  fontWeight: 500,
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8" role="status" aria-busy="true">
          <Skeleton className="mb-6 h-9 w-64" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  )
}

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [event, setEvent] = useState<Event | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [proximosEventos, setProximosEventos] = useState<Event[]>([])

  const loadData = useCallback(async () => {
    if (!eventId) return

    setLoading(true)
    try {
      const adminId = getCurrentUserId()
      const [eventData, enrollmentData, adminEvents] = await Promise.all([
        getEventById(eventId),
        getEnrollments(eventId),
        adminId ? getEventsByAdmin(adminId) : Promise.resolve([] as Event[]),
      ])

      if (!eventData) {
        router.push('/admin/events')
        return
      }
      setEvent(eventData)
      setEnrollments(enrollmentData)
      setFilteredEnrollments(enrollmentData)
      setProximosEventos(adminEvents.filter(e => e.id !== eventId).slice(0, 2))
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, router])

  useEffect(() => {
    if (!eventId) {
      router.push('/admin/events')
      return
    }

    loadData()
  }, [eventId, router, loadData])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredEnrollments(
        enrollments.filter(e =>
          e.userName.toLowerCase().includes(query) ||
          e.userEmail.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredEnrollments(enrollments)
    }
  }, [searchQuery, enrollments])

  function handleLogout() {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  function downloadCSV(filename: string, rows: string[][]) {
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function exportToCSV() {
    if (filteredEnrollments.length === 0) return

    const rows = [
      ['Nome', 'E-mail', 'Status', 'Data Inscrição', 'Check-in'],
      ...filteredEnrollments.map((enrollment) => [
        enrollment.userName,
        enrollment.userEmail,
        enrollment.checkedInAt ? 'Check-in feito' : 'Confirmado',
        new Date(enrollment.enrolledAt).toLocaleString('pt-BR'),
        enrollment.checkedInAt
          ? new Date(enrollment.checkedInAt).toLocaleString('pt-BR')
          : '—',
      ]),
    ]

    downloadCSV(`inscritos-${event?.id ?? 'evento'}.csv`, rows)
  }

  function exportEnrollmentToCSV(enrollment: EnrollmentWithDetails) {
    const rows = [
      ['Nome', 'E-mail', 'Status', 'Data Inscrição', 'Check-in'],
      [
        enrollment.userName,
        enrollment.userEmail,
        enrollment.checkedInAt ? 'Check-in feito' : 'Confirmado',
        new Date(enrollment.enrolledAt).toLocaleString('pt-BR'),
        enrollment.checkedInAt
          ? new Date(enrollment.checkedInAt).toLocaleString('pt-BR')
          : '—',
      ],
    ]

    downloadCSV(`inscrito-${enrollment.userName.replace(/\s+/g, '-').toLowerCase()}.csv`, rows)
  }

  async function handleCancelEnrollment(enrollment: EnrollmentWithDetails) {
    if (!eventId) return

    const confirmed = confirm(
      `Cancelar inscrição de "${enrollment.userName}"?\n\nA vaga será liberada no evento.`,
    )
    if (!confirmed) return

    setActionLoadingId(enrollment.id)
    try {
      const result = await unenrollUser(enrollment.userId, eventId)
      if (!result.success) {
        alert(result.error || 'Erro ao cancelar inscrição')
        return
      }

      const updated = enrollments.filter((item) => item.id !== enrollment.id)
      setEnrollments(updated)
      setFilteredEnrollments(updated)

      const eventData = await getEventById(eventId)
      if (eventData) setEvent(eventData)

      if (result.emailSent) {
        alert(`Inscrição cancelada. ${enrollment.userName} foi notificado(a) por e-mail.`)
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="mb-2 h-8 w-64 max-w-full" />
        <Skeleton className="mb-8 h-4 w-80 max-w-full" />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="mt-6 h-72 rounded-lg" />
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium text-foreground">Evento não encontrado</p>
        <p className="text-sm text-muted-foreground">Use o menu lateral para acessar seus eventos.</p>
      </div>
    )
  }

  const availableSpots = Math.max(0, event.capacity - event.currentEnrollments)
  const occupancyPercent = (event.currentEnrollments / event.capacity) * 100
  const confirmados = Math.round(event.currentEnrollments * 0.8)
  const cancelados = event.currentEnrollments - confirmados
  const checkInsRealizados = confirmados

  const pieData = [
    { name: 'Confirmados', value: confirmados, color: CHART_BLUE },
    { name: 'Check-in', value: checkInsRealizados, color: CHART_ORANGE },
    { name: 'Cancelados', value: cancelados, color: CHART_TEAL }
  ]

  const lineChartData = [
    { time: '08:00', capacidadeTotal: 0, inscritosConfirmados: 0, checkInsRealizados: 0 },
    { time: '10:00', capacidadeTotal: 100, inscritosConfirmados: 30, checkInsRealizados: 20 },
    { time: '12:00', capacidadeTotal: 200, inscritosConfirmados: 80, checkInsRealizados: 60 },
    { time: '14:00', capacidadeTotal: 300, inscritosConfirmados: 120, checkInsRealizados: 100 },
    { time: '16:00', capacidadeTotal: 350, inscritosConfirmados: 150, checkInsRealizados: 120 },
    { time: '18:00', capacidadeTotal: 350, inscritosConfirmados: confirmados, checkInsRealizados: checkInsRealizados }
  ]

  const stats = [
    {
      label: 'Total de Inscritos',
      value: String(event.currentEnrollments),
      helper: `${confirmados} confirmados, ${cancelados} cancelados`,
      icon: Users,
    },
    {
      label: 'Presentes (Check-in)',
      value: String(checkInsRealizados),
      helper: `${Math.round((checkInsRealizados / event.capacity) * 100)}% da capacidade`,
      icon: UserCheck,
    },
    {
      label: 'Vagas Restantes',
      value: String(availableSpots),
      helper: `Capacidade máxima: ${event.capacity}`,
      icon: Tag,
    },
    {
      label: 'Taxa de Ocupação',
      value: `${Math.round(occupancyPercent)}%`,
      helper: `${event.currentEnrollments} de ${event.capacity} vagas`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* Cabeçalho da página */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Visão Geral do Evento
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground md:text-base">
            {event.title} — {new Date(event.date).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-11 w-full shrink-0 sm:w-auto"
          onClick={() => router.push(`/admin/events/${event.id}/check-in`)}
        >
          <QrCode aria-hidden="true" />
          Ler QR Code
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4 md:p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{stat.helper}</p>
            </Card>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        {/* Status dos Inscritos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Status dos Inscritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  strokeWidth={0}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM}
                  labelStyle={CHART_TOOLTIP_LABEL}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {pieData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-medium text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Ocupação e Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Taxa de Ocupação e Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={40} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={CHART_TOOLTIP_ITEM}
                  labelStyle={CHART_TOOLTIP_LABEL}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={(value: string) => (
                    <span style={{ color: '#64748b', fontSize: 11 }}>{value}</span>
                  )}
                />
                <Line type="monotone" dataKey="capacidadeTotal" stroke={CHART_BLUE} strokeWidth={2} dot={false} name="Capacidade Total" />
                <Line type="monotone" dataKey="inscritosConfirmados" stroke={CHART_ORANGE} strokeWidth={2} dot={false} name="Inscritos Confirmados" />
                <Line type="monotone" dataKey="checkInsRealizados" stroke={CHART_TEAL} strokeWidth={2} dot={false} name="Check-Ins Realizados" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista + coluna lateral */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Lista de Inscritos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-base md:text-lg">Lista de Inscritos</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="w-full sm:w-auto">
              <FileDown aria-hidden="true" />
              Exportar para CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Buscar por nome ou e-mail"
                aria-label="Buscar inscritos"
                icon={<Search aria-hidden="true" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tabela (desktop largo) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-3 font-medium">Nome</th>
                    <th className="py-3 pr-3 font-medium">E-mail</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 font-medium">Hora Check-in</th>
                    <th className="py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum inscrito encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.slice(0, 10).map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="max-w-[10rem] truncate py-3 pr-3 font-medium text-foreground">{enrollment.userName}</td>
                        <td className="max-w-[12rem] truncate py-3 pr-3 text-muted-foreground">{enrollment.userEmail}</td>
                        <td className="py-3 pr-3">
                          <Badge variant="success">Confirmado</Badge>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 text-destructive hover:text-destructive"
                              disabled={actionLoadingId === enrollment.id}
                              onClick={() => void handleCancelEnrollment(enrollment)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportEnrollmentToCSV(enrollment)}
                            >
                              Exportar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Cards (mobile e tablet) */}
            <div className="space-y-3 lg:hidden">
              {filteredEnrollments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum inscrito encontrado
                </p>
              ) : (
                filteredEnrollments.slice(0, 10).map((enrollment) => (
                  <div key={enrollment.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate font-medium text-foreground">
                        {enrollment.userName}
                      </p>
                      <Badge variant="success">Confirmado</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {enrollment.userEmail}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      Check-in às {new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR')}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 flex-1 text-destructive hover:text-destructive"
                        disabled={actionLoadingId === enrollment.id}
                        onClick={() => void handleCancelEnrollment(enrollment)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 flex-1"
                        onClick={() => exportEnrollmentToCSV(enrollment)}
                      >
                        Exportar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coluna lateral */}
        <div className="space-y-4 md:space-y-6">
          {/* Check-Ins Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Check-Ins Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum check-in ainda</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 4).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {enrollment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {enrollment.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proximosEventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum outro evento</p>
                ) : (
                  proximosEventos.map(evt => (
                    <div key={evt.id} className="rounded-md bg-muted p-3">
                      <p className="truncate text-sm font-medium text-foreground">{evt.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {new Date(evt.date).toLocaleDateString('pt-BR')} — {evt.time}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
