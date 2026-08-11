'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUpcomingEvents, getCategories } from '../../lib/events'
import { Event, EventFilters } from '../../lib/types'
import { getCurrentUserId } from '../../lib/auth-guard'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const userId = getCurrentUserId()
    if (!userId) {
      router.push('/login')
      return
    }

    loadEvents()
    loadCategories()
  }, [router])

  useEffect(() => {
    const filters: EventFilters = {}
    if (searchQuery.trim()) filters.search = searchQuery
    if (selectedCategory) filters.category = selectedCategory

    getUpcomingEvents(filters).then(setEvents)
  }, [searchQuery, selectedCategory])

  async function loadEvents() {
    setLoading(true)
    try {
      const upcomingEvents = await getUpcomingEvents()
      setEvents(upcomingEvents)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Descobrir Eventos</h1>
                <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 mt-1 md:mt-2">Encontre e inscreva-se em eventos</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium transition text-sm md:text-base flex-shrink-0 w-full sm:w-auto"
              >
                ← Voltar
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="🔍 Buscar eventos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 md:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base md:text-sm"
                  />
                </div>
                <div className="sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 md:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base md:text-sm"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                {events.length} evento{events.length !== 1 ? 's' : ''} encontrado{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {events.length === 0 ? (
          <EmptyState message="Nenhum evento disponível" icon="📭" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.map((event) => (
              <div key={event.id} onClick={() => router.push(`/events/${event.id}`)} className="card p-4 md:p-6 hover:shadow-lg cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-3 flex-wrap">
                  <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {event.category}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex-shrink-0">
                    {event.capacity - event.currentEnrollments} vagas
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-1 md:space-y-2 mb-4 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  <p>📅 {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</p>
                  <p className="truncate">📍 {event.location}</p>
                </div>

                <div className="mb-4 mt-auto">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Inscritos</span>
                    <span>{event.currentEnrollments} / {event.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{width: `${(event.currentEnrollments / event.capacity) * 100}%`}} />
                  </div>
                </div>

                <button className="w-full px-4 py-2 md:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm md:text-base transition">
                  Ver Detalhes →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
