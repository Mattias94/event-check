'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingState from '../../../../components/LoadingState'
import ErrorState from '../../../../components/ErrorState'
import EmptyState from '../../../../components/EmptyState'
import { getEventsByAdmin, deleteEvent, cancelEvent } from '../../../../lib/events'
import { getCurrentUserId, requireAdmin } from '../../../../lib/auth-guard'
import { Event } from '../../../../lib/types'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
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
      `Tem certeza que deseja deletar o evento "${eventTitle}"?\n\n⚠️ Esta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    try {
      const result = await deleteEvent(eventId)
      if (!result.success) {
        showToast(result.error || 'Erro ao deletar evento', 'error')
        return
      }

      setEvents(events.filter(e => e.id !== eventId))
      showToast(`✅ Evento "${eventTitle}" deletado com sucesso`, 'success')
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
        showToast(`✅ Evento cancelado. ${inscritosCount} inscrito(s) notificado(s).`, 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao cancelar evento', 'error')
      console.error('Erro ao cancelar evento:', err)
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadEvents} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meus Eventos</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Gerencie e crie seus eventos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium transition"
              >
                👤 Pesquisar Usuários
              </button>
              <button
                onClick={() => router.push('/admin/events/create')}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium transition"
              >
                + Criar Evento
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {events.length === 0 ? (
          <EmptyState
            message="Você ainda não criou nenhum evento"
            icon="📋"
            actionButton={{
              label: '+ Criar Seu Primeiro Evento',
              onClick: () => router.push('/admin/events/create'),
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Eventos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {events.length}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Ativos</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {events.filter(e => e.status === 'active').length}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Inscritos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {events.reduce((sum, e) => sum + e.currentEnrollments, 0)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Cancelados</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {events.filter(e => e.status === 'cancelled').length}
                </p>
              </div>
            </div>

            {/* Events List */}
            <div className="grid grid-cols-1 gap-4">
              {events.map(event => (
                <div key={event.id} className="card p-4 hover:shadow-lg transition">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Event Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">
                          {event.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            event.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : event.status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {event.status === 'active'
                            ? '🟢 Ativo'
                            : event.status === 'cancelled'
                            ? '🔴 Cancelado'
                            : '⚫ Finalizado'}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <p>
                          📅 {new Date(event.date).toLocaleDateString('pt-BR')} às{' '}
                          {event.time}
                        </p>
                        <p>📍 {event.location}</p>
                        <p>📂 {event.category}</p>
                      </div>
                    </div>

                    {/* Capacity Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Inscritos</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {event.currentEnrollments} / {event.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            event.currentEnrollments / event.capacity > 0.8
                              ? 'bg-red-500'
                              : event.currentEnrollments / event.capacity > 0.5
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${(event.currentEnrollments / event.capacity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 justify-start">
                      <button
                        onClick={() => router.push(`/admin/dashboard?eventId=${event.id}`)}
                        className="px-3 py-2 rounded text-sm font-medium text-slate-900 dark:text-white bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition"
                      >
                        📊 Dashboard
                      </button>
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className="px-3 py-2 rounded text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                      >
                        ✏️ Editar
                      </button>

                      {event.status === 'active' && (
                        <button
                          onClick={() => handleCancel(event.id, event.title)}
                          className="px-3 py-2 rounded text-sm font-medium text-yellow-900 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition"
                        >
                          ⏸️ Cancelar
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={event.currentEnrollments > 0}
                        className={`px-3 py-2 rounded text-sm font-medium transition ${
                          event.currentEnrollments > 0
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-400 dark:text-red-400 cursor-not-allowed'
                            : 'text-red-900 dark:text-red-200 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40'
                        }`}
                        title={
                          event.currentEnrollments > 0
                            ? `${event.currentEnrollments} inscrito(s). Cancele primeiro.`
                            : 'Deletar evento'
                        }
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
