'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { getUpcomingEvents, getCategories } from '../../lib/events'
import { Event, EventFilters } from '../../lib/types'
import UserProtection from '../../components/UserProtection'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import EventCard from '../../components/EventCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

function EventsPageContent() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedCategory || startDate || endDate)

  const loadEvents = useCallback(async (filters?: EventFilters) => {
    setLoading(true)
    setError(null)
    try {
      const upcomingEvents = await getUpcomingEvents(filters)
      setEvents(upcomingEvents)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
      setError('Erro ao carregar eventos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const filters: EventFilters = {}
    if (searchQuery.trim()) filters.search = searchQuery
    if (selectedCategory) filters.category = selectedCategory
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    loadEvents(filters)
  }, [searchQuery, selectedCategory, startDate, endDate, loadEvents])

  async function loadCategories() {
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setSelectedCategory('')
    setStartDate('')
    setEndDate('')
  }

  if (loading && events.length === 0 && !error) return <LoadingState />
  if (error && events.length === 0) {
    return <ErrorState message={error} onRetry={() => loadEvents()} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="-ml-2 mb-4 h-11 md:h-9"
          >
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Button>

          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Descobrir Eventos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Encontre e inscreva-se em eventos
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  aria-label="Buscar eventos"
                  icon={<Search aria-hidden="true" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="sm:w-56">
                <Select
                  aria-label="Filtrar por categoria"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                type="date"
                label="Data inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="Data final"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted-foreground md:text-sm">
              {loading ? 'Carregando...' : `${events.length} evento${events.length !== 1 ? 's' : ''} encontrado${events.length !== 1 ? 's' : ''}`}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {error ? (
          <ErrorState message={error} onRetry={() => loadEvents()} />
        ) : events.length === 0 ? (
          <EmptyState
            message={
              hasActiveFilters
                ? 'Nenhum evento encontrado com os filtros selecionados'
                : 'Nenhum evento disponível no momento'
            }
            icon="📭"
            actionButton={
              hasActiveFilters
                ? { label: 'Limpar filtros', onClick: clearFilters }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function EventsPage() {
  return (
    <UserProtection>
      <EventsPageContent />
    </UserProtection>
  )
}
