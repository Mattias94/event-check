"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getEnrollmentsForUser, getUpcomingEvents } from '../lib/events'
import { Event } from '../lib/types'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'Tecnologia': '💻',
  'Negócios': '📈',
  'Saúde': '🏥',
  'Educação': '📚',
  'Arte': '🎨',
  'Música': '🎵',
  'Esporte': '⚽',
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '🎉'
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [historyEvents, setHistoryEvents] = useState<Event[]>([])
  const [newEvents, setNewEvents] = useState<Event[]>([])

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(currentUser)
    setUser(parsedUser)
    loadEvents(parsedUser.id)
    setLoading(false)
  }, [router])

  function loadEvents(userId: string) {
    Promise.all([getEnrollmentsForUser(userId), getUpcomingEvents()]).then(
      ([enrolledEvents, allUpcoming]) => {
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
          .slice(0, 4)

        setUpcomingEvents(upcoming)
        setHistoryEvents(history)
        setNewEvents(discover)
      }
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/register')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
      </div>
    )
  }

  if (!user) return null

  const userName = user.name.toUpperCase()
  const userEmail = user.email
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col gap-4">
            <div>
              <div className="md:hidden mb-2">
                <h1 className="text-lg font-bold flex items-center text-slate-900 dark:text-white">Event-Check</h1>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo</h2>
              <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 mt-1">Aqui estão os seus eventos, {userName}.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin/events')}
                  className="px-4 py-2 md:py-2 rounded-md bg-sky-600 text-white hover:opacity-90 transition text-sm md:text-base font-medium"
                >
                  Painel Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 md:py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition text-sm md:text-base font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Upcoming Events & History */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Upcoming Events */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-slate-900 dark:text-white">Meus Próximos Eventos</h2>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="card p-4 md:p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="inline-block px-3 py-1 rounded-full text-white text-xs md:text-sm font-medium mb-3 bg-green-500">
                            {event.title}
                          </div>
                          <div className="space-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                            <p className="truncate">Local: {event.location}</p>
                            <p>Data: {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</p>
                            <p className="text-green-600 dark:text-green-400">Status: Confirmado (Inscrito)</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-col items-center gap-2 md:items-end flex-shrink-0">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 dark:bg-slate-600 rounded text-xs flex items-center justify-center text-slate-500">
                              QR Code
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="px-3 py-1 rounded-md bg-slate-900 text-white text-xs md:text-sm hover:opacity-90 transition font-medium w-full md:w-auto"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-4 md:p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm md:text-base">Você ainda não está inscrito em nenhum evento futuro.</p>
                  <button
                    onClick={() => router.push('/events')}
                    className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition font-medium w-full md:w-auto"
                  >
                    Descobrir Eventos
                  </button>
                </div>
              )}
            </section>

            {/* Event History */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-slate-900 dark:text-white">Histórico de Eventos</h2>
              {historyEvents.length > 0 ? (
                <div className="card p-4 md:p-6">
                  <div className="space-y-3">
                    {historyEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-sm md:text-base truncate">{event.title}</p>
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={event.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}>
                            {event.status === 'cancelled' ? '✕' : '✓'}
                          </span>
                          <span className={`text-xs md:text-sm font-medium ${event.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                            {event.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card p-4 md:p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Nenhum evento no seu histórico ainda.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Discover Events & Account */}
          <div className="space-y-6 md:space-y-8">
            {/* Discover Events */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">Descubra Novos Eventos</h2>
              </div>
              <div className="space-y-4">
                {newEvents.length > 0 ? (
                  <>
                    {newEvents.map((event) => (
                      <div
                        key={event.id}
                        className="card p-4 hover:shadow-lg transition cursor-pointer h-full flex flex-col"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <div className="mb-3">
                          <div className="w-full h-24 md:h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-md flex items-center justify-center text-3xl md:text-4xl">
                            {getCategoryIcon(event.category)}
                          </div>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm md:text-base line-clamp-2">{event.title}</h3>
                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-2">Data: {new Date(event.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">Vagas Restantes: {event.capacity - event.currentEnrollments}</p>
                        <button className="w-full px-3 py-2 rounded-md bg-slate-900 text-white text-xs md:text-sm hover:opacity-90 transition font-medium mt-auto">
                          Ver Detalhes
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="card p-4 md:p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm md:text-base">Novos eventos aparecerão em breve!</p>
                    <button
                      onClick={() => router.push('/events')}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition font-medium"
                    >
                      Ver Todos os Eventos
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Account Info */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-slate-900 dark:text-white">Minha Conta</h2>
              <div className="card p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4 mb-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-sky-400 to-slate-600 flex items-center justify-center text-white text-lg md:text-2xl font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm md:text-base truncate">{userName}</h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex-1 px-3 py-2 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition font-medium">
                    Editar
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium">
                    Configurações
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
