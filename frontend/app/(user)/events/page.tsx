'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { DEFAULT_EVENT_CATEGORIES } from '../../../lib/event-categories'
import { getUpcomingEvents, getCategories } from '../../../lib/events'
import { Event, EventFilters } from '../../../lib/types'
import LoadingState from '../../../components/LoadingState'
import ErrorState from '../../../components/ErrorState'
import EmptyState from '../../../components/EmptyState'
import EventCard from '../../../components/EventCard'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import DateField from '../../../components/ui/DateField'
import { cn } from '../../../lib/utils'

const compactFieldClassName =
  'h-11 min-h-11 border-border/60 bg-background/80 py-2 text-sm shadow-none md:h-9 md:min-h-0 md:py-1.5'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categories, setCategories] = useState<string[]>([...DEFAULT_EVENT_CATEGORIES])
  const [filtersOpen, setFiltersOpen] = useState(false)

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
      setCategories([...DEFAULT_EVENT_CATEGORIES])
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
    <div className="min-h-full bg-background">
      <header className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
          <div className="mb-4">
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Descobrir Eventos
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
              Encontre e inscreva-se em eventos
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/60 p-3 backdrop-blur-sm md:p-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Input
                  type="search"
                  placeholder="Buscar por nome ou descrição..."
                  aria-label="Buscar eventos"
                  icon={<Search className="size-3.5 opacity-60" aria-hidden="true" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={compactFieldClassName}
                />
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-11 min-h-11 flex-1 gap-1.5 border-border/60 bg-background/80 px-3 text-xs font-normal shadow-none sm:flex-none md:h-9 md:min-h-0',
                    filtersOpen && 'border-primary/40 bg-primary/5 text-foreground',
                  )}
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                >
                  <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      !
                    </span>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-11 min-h-11 shrink-0 px-3 text-xs text-muted-foreground md:h-9 md:min-h-0"
                    onClick={clearFilters}
                    aria-label="Limpar filtros"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out',
                filtersOpen
                  ? 'mt-2.5 grid-rows-[1fr] opacity-100'
                  : 'pointer-events-none invisible mt-0 grid-rows-[0fr] opacity-0',
              )}
              aria-hidden={!filtersOpen}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 gap-2 border-t border-border/40 pt-2.5 sm:grid-cols-3">
                  <Select
                    aria-label="Filtrar por categoria"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={compactFieldClassName}
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>

                  <DateField
                    label="De"
                    value={startDate}
                    onChange={setStartDate}
                    clearable
                    allowManualInput
                    calendarSize="compact"
                    compact
                    showFormatHint={false}
                    placeholder="Data inicial"
                  />
                  <DateField
                    label="Até"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={setEndDate}
                    clearable
                    allowManualInput
                    calendarSize="compact"
                    compact
                    showFormatHint={false}
                    placeholder="Data final"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-border/30 pt-2">
              <p className="text-[11px] text-muted-foreground md:text-xs">
                {loading
                  ? 'Carregando...'
                  : `${events.length} evento${events.length !== 1 ? 's' : ''} encontrado${events.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
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
              hasActiveFilters ? { label: 'Limpar filtros', onClick: clearFilters } : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
