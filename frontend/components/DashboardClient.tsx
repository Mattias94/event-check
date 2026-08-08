"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  status: string
  color: string
  qrCode?: string
}

interface NewEvent {
  id: string
  title: string
  date: string
  image: string
  availableSpots: number
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(currentUser))
    setLoading(false)
  }, [router])

  const upcomingEvents: Event[] = [
    {
      id: '1',
      title: 'Workshop de Arquitetura Limpa',
      date: '20/08/2024',
      time: '14:00',
      location: 'Auditório A',
      status: 'Confirmado (Inscrito)',
      color: 'bg-green-500',
      qrCode: true as any
    },
    {
      id: '2',
      title: 'Tech Summit',
      date: '10/09/2024',
      time: '09:00',
      location: 'Centro de Convenções',
      status: 'Confirmado',
      color: 'bg-cyan-500'
    }
  ]

  const newEvents: NewEvent[] = [
    {
      id: '1',
      title: 'Inovação em IA',
      date: '25/09',
      image: '🤖',
      availableSpots: 50
    },
    {
      id: '2',
      title: 'Frontend Masters',
      date: '10/10',
      image: '💻',
      availableSpots: 110
    }
  ]

  const historyEvents = [
    {
      id: '1',
      title: 'DevOps Conf',
      date: '15/07/2024',
      status: 'Check-in Realizado'
    }
  ]

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

  const userName = user.name
  .toUpperCase()
  const userEmail = user.email
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="md:hidden mb-2">
                <h1 className="text-xl font-bold flex items-center text-slate-900 dark:text-white">Event-Check</h1>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo</h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">Aqui estão os seus eventos, {userName}.</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition text-sm md:text-base"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Events & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Meus Próximos Eventos</h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="card p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium mb-3 ${event.color}`}>
                          {event.title}
                        </div>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <p>Local: {event.location}</p>
                          <p>Horário: {event.time}</p>
                          <p className="text-green-600 dark:text-green-400">Status: {event.status}</p>
                        </div>
                      </div>
                      {event.qrCode && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-600 rounded text-xs flex items-center justify-center text-slate-500">
                              QR Code
                            </div>
                          </div>
                          <button className="px-3 py-1 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition">
                            Ver Detalhes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Event History */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Histórico de Eventos</h2>
              <div className="card p-6">
                <div className="space-y-3">
                  {historyEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{event.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{event.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm font-medium text-green-600">{event.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Discover Events & Account */}
          <div className="space-y-8">
            {/* Discover Events */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Descubra Novos Eventos</h2>
              </div>
              <div className="space-y-4">
                {newEvents.map((event) => (
                  <div key={event.id} className="card p-4 hover:shadow-lg transition">
                    <div className="mb-3">
                      <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-md flex items-center justify-center text-4xl">
                        {event.image}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Data: {event.date}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Vagas Restantes: {event.availableSpots}</p>
                    <button className="w-full px-3 py-2 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition">
                      Inscrever-se
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Account Info */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Minha Conta</h2>
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-slate-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{userName}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{userEmail}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 rounded-md bg-slate-900 text-white text-sm hover:opacity-90 transition">
                    Editar
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition">
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
