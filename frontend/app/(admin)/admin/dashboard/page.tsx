'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getEventById, getEnrollments, getEventsByAdmin } from '../../../../lib/events'
import { getUserById } from '../../../../lib/auth'
import { Event, EnrollmentRecord } from '../../../../lib/types'
import { getCurrentUserId, requireAdmin } from '../../../../lib/auth-guard'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface EnrollmentWithDetails extends EnrollmentRecord {
  userName: string
  userEmail: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [event, setEvent] = useState<Event | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [proximosEventos, setProximosEventos] = useState<Event[]>([])

  useEffect(() => {
    if (!eventId) {
      router.push('/admin/events')
      return
    }

    loadData()
  }, [eventId, router])

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

  async function loadData() {
    setLoading(true)
    try {
      const eventData = await getEventById(eventId!)
      if (!eventData) {
        router.push('/admin/events')
        return
      }
      setEvent(eventData)

      const enrollmentData = await getEnrollments(eventId!)
      const enriched = await Promise.all(
        enrollmentData.map(async (enrollment): Promise<EnrollmentWithDetails> => {
          const user = await getUserById(enrollment.userId)
          return {
            ...enrollment,
            userName: user?.name || enrollment.userId,
            userEmail: user?.email || '—',
          }
        })
      )
      setEnrollments(enriched)
      setFilteredEnrollments(enriched)

      const adminId = getCurrentUserId()
      if (adminId) {
        const adminEvents = await getEventsByAdmin(adminId)
        setProximosEventos(adminEvents.filter(e => e.id !== eventId).slice(0, 2))
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  function exportToCSV() {
    if (filteredEnrollments.length === 0) return

    const headers = ['Nome', 'E-mail', 'Status', 'Hora Check-in', 'Ações']
    const data = filteredEnrollments.map((enrollment) => [
      enrollment.userName,
      enrollment.userEmail,
      'Confirmado',
      new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR'),
      'Visualizar | Cancelar | Exportar'
    ])

    const csv = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscritos-${event?.id}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Evento não encontrado</p>
      </div>
    )
  }

  const availableSpots = Math.max(0, event.capacity - event.currentEnrollments)
  const occupancyPercent = (event.currentEnrollments / event.capacity) * 100
  const confirmados = Math.round(event.currentEnrollments * 0.8)
  const cancelados = event.currentEnrollments - confirmados
  const checkInsRealizados = confirmados

  const pieData = [
    { name: 'Confirmados', value: confirmados, color: '#10b981' },
    { name: 'Check-in', value: checkInsRealizados, color: '#3b82f6' },
    { name: 'Cancelados', value: cancelados, color: '#ef4444' }
  ]

  const lineChartData = [
    { time: '08:00', capacidadeTotal: 0, inscritosConfirmados: 0, checkInsRealizados: 0 },
    { time: '10:00', capacidadeTotal: 100, inscritosConfirmados: 30, checkInsRealizados: 20 },
    { time: '12:00', capacidadeTotal: 200, inscritosConfirmados: 80, checkInsRealizados: 60 },
    { time: '14:00', capacidadeTotal: 300, inscritosConfirmados: 120, checkInsRealizados: 100 },
    { time: '16:00', capacidadeTotal: 350, inscritosConfirmados: 150, checkInsRealizados: 120 },
    { time: '18:00', capacidadeTotal: 350, inscritosConfirmados: confirmados, checkInsRealizados: checkInsRealizados }
  ]

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">EventCheck</span>
                <span className="text-lg md:text-xl">📋</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                Visão Geral do Evento: {event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/events')}
              className="px-3 md:px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition text-sm md:text-base flex-shrink-0 w-full sm:w-auto"
            >
              ← Voltar para Meus Eventos
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Inscritos */}
          <div className="card p-4 md:p-6 bg-slate-800 dark:bg-slate-700 text-white rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-300">👥 Total de Inscritos</span>
            </div>
            <p className="text-2xl md:text-4xl font-bold mb-2">{event.currentEnrollments}</p>
            <p className="text-xs text-slate-400">
              {confirmados} Confirmados + {cancelados} Cancelados
            </p>
          </div>

          {/* Presentes (Check-in) */}
          <div className="card p-4 md:p-6 bg-slate-800 dark:bg-slate-700 text-white rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-300">✓ Presentes (Check-in)</span>
            </div>
            <p className="text-2xl md:text-4xl font-bold mb-2">{checkInsRealizados}</p>
            <p className="text-xs text-green-400">
              ↑ {Math.round((checkInsRealizados / event.capacity) * 100)}% da Capacidade
            </p>
          </div>

          {/* Vagas Restantes */}
          <div className="card p-4 md:p-6 bg-slate-800 dark:bg-slate-700 text-white rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-300">✨ Vagas Restantes</span>
            </div>
            <p className="text-2xl md:text-4xl font-bold mb-2">{availableSpots}</p>
            <p className="text-xs text-slate-400">
              Capacidade Máxima: {event.capacity}
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Status dos Inscritos */}
            <div className="card p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Status dos Inscritos
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-4 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Confirmados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Check-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Cancelados</span>
                </div>
              </div>
            </div>

            {/* Taxa de Ocupação e Check-in */}
            <div className="card p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl overflow-x-auto">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Taxa de Ocupação e Check-in
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="capacidadeTotal" stroke="#8884d8" name="Capacidade Total" />
                  <Line type="monotone" dataKey="inscritosConfirmados" stroke="#82ca9d" name="Inscritos Confirmados" />
                  <Line type="monotone" dataKey="checkInsRealizados" stroke="#ffc658" name="Check-Ins Realizados" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de Inscritos */}
            <div className="card p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">
                  Lista de Inscritos
                </h2>
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1 rounded text-xs md:text-sm bg-slate-800 hover:bg-slate-700 text-white font-medium transition w-full sm:w-auto"
                >
                  Exportar para CSV
                </button>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="🔍 Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <button className="px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition whitespace-nowrap">
                  ⊟ Filter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-slate-900 dark:text-white">Nome</th>
                      <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-slate-900 dark:text-white hidden sm:table-cell">E-mail</th>
                      <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-slate-900 dark:text-white">Status</th>
                      <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-slate-900 dark:text-white hidden md:table-cell">Hora Check-in</th>
                      <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-slate-900 dark:text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 text-xs md:text-sm">
                          Nenhum inscrito encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredEnrollments.slice(0, 10).map((enrollment) => (
                        <tr key={enrollment.id} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="py-2 md:py-3 px-2 md:px-3 text-slate-900 dark:text-white text-xs md:text-sm">{enrollment.userName}</td>
                          <td className="py-2 md:py-3 px-2 md:px-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell text-xs md:text-sm">{enrollment.userEmail}</td>
                          <td className="py-2 md:py-3 px-2 md:px-3">
                            <span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 font-medium">
                              Confirmado
                            </span>
                          </td>
                          <td className="py-2 md:py-3 px-2 md:px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell text-xs">
                            {new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR')}
                          </td>
                          <td className="py-2 md:py-3 px-2 md:px-3">
                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                              <button className="px-1.5 md:px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-medium hover:opacity-80 transition whitespace-nowrap">
                                Ver
                              </button>
                              <button className="px-1.5 md:px-2 py-1 rounded text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 font-medium hover:opacity-80 transition whitespace-nowrap">
                                Canc
                              </button>
                              <button className="px-1.5 md:px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium hover:opacity-80 transition whitespace-nowrap hidden md:inline-block">
                                Exportar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            {/* Check-Ins Recentes */}
            <div className="card p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Check-Ins Recentes
              </h2>
              <div className="space-y-3">
                {enrollments.slice(0, 4).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-3">
                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                      {enrollment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-white truncate">
                        {enrollment.userName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(enrollment.enrolledAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Eventos */}
            <div className="card p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Próximos Eventos
              </h2>
              <div className="space-y-3">
                {proximosEventos.length === 0 ? (
                  <p className="text-xs md:text-sm text-slate-500">Nenhum outro evento</p>
                ) : (
                  proximosEventos.map(evt => (
                    <div key={evt.id} className="p-3 rounded bg-slate-50 dark:bg-slate-700">
                      <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-white truncate">
                        {evt.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(evt.date).toLocaleDateString('pt-BR')} - {evt.time}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
