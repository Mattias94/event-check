'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminEventForm from '../../../../../components/admin/AdminEventForm'
import LoadingState from '../../../../../components/LoadingState'
import ErrorState from '../../../../../components/ErrorState'
import { getEventById, updateEvent, getEnrollments } from '../../../../../lib/events'
import { Event, EnrollmentRecord } from '../../../../../lib/types'
import { EventCreationData } from '../../../../../lib/schemas'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    getEventById(eventId)
      .then(async (eventData) => {
        if (!eventData) {
          setError('Evento não encontrado')
          return
        }
        setEvent(eventData)

        const enrollmentData = await getEnrollments(eventId)
        setEnrollments(enrollmentData)
      })
      .catch(() => setError('Erro ao carregar evento'))
      .finally(() => setLoading(false))
  }, [eventId])

  async function handleUpdate(data: EventCreationData) {
    setSubmitError(null)
    try {
      const updated = await updateEvent(eventId, data)
      if (!updated) {
        setSubmitError('Erro ao atualizar evento')
        return
      }
      setEvent(updated)
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao atualizar evento')
    }
  }

  if (loading) return <LoadingState />
  if (error || !event) return <ErrorState message={error || 'Evento não encontrado'} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <button
            onClick={() => router.push('/admin/events')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{event.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AdminEventForm
              initialData={event}
              onSubmit={handleUpdate}
              error={submitError}
            />
          </div>

          <div className="space-y-6">
            <div className="card p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Inscritos ({enrollments.length})</h3>
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Nenhum inscrito ainda</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {enrollments.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <div className="font-medium">ID: {enrollment.userId}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4 bg-slate-100 dark:bg-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Status</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {event.status === 'active' ? '🟢 Ativo' : event.status === 'cancelled' ? '🔴 Cancelado' : '⚫ Finalizado'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Capacidade</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {event.currentEnrollments} / {event.capacity}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Vagas Disponíveis</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {Math.max(0, event.capacity - event.currentEnrollments)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
