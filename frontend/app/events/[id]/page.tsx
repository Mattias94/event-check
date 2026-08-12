'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getEventById, getEnrollments, enrollUser, unenrollUser, isUserEnrolled } from '../../../lib/events'
import { Event, EnrollmentRecord } from '../../../lib/types'
import { getCurrentUserId } from '../../../lib/auth-guard'
import LoadingState from '../../../components/LoadingState'
import ErrorState from '../../../components/ErrorState'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const currentUserId = getCurrentUserId()

  useEffect(() => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    loadData()
  }, [currentUserId, router, eventId])

  function loadData() {
    setLoading(true)
    getEventById(eventId)
      .then(async (eventData) => {
        setEvent(eventData)
        if (eventData && currentUserId) {
          setIsEnrolled(await isUserEnrolled(currentUserId, eventId))
        }
      })
      .finally(() => setLoading(false))
  }

  async function handleEnroll() {
    if (!currentUserId) return
    setEnrolling(true)
    try {
      const result = await enrollUser(currentUserId, eventId)
      if (result.success) {
        setIsEnrolled(true)
        loadData()
      }
    } finally {
      setEnrolling(false)
    }
  }

  async function handleUnenroll() {
    if (!currentUserId) return
    if (!confirm('Desinscrever?')) return
    setEnrolling(true)
    try {
      const result = await unenrollUser(currentUserId, eventId)
      if (result.success) {
        setIsEnrolled(false)
        loadData()
      }
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <LoadingState />
  if (!event) return <ErrorState message="Não encontrado" onRetry={() => router.push('/events')} />

  const avail = event.capacity - event.currentEnrollments
  const pct = (event.currentEnrollments / event.capacity) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <button onClick={() => router.push('/events')} className="px-3 md:px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium mb-3 md:mb-4 text-sm md:text-base">
            ← Voltar
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{event.title}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="card p-4 md:p-6 space-y-4 md:space-y-6">
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">{event.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">📅 Data</p>
                  <p className="font-semibold text-sm md:text-base">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">🕐 Hora</p>
                  <p className="font-semibold text-sm md:text-base">{event.time}</p>
                </div>
                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">📍 Local</p>
                  <p className="font-semibold text-sm md:text-base">{event.location}</p>
                </div>
                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">👥 Capacidade</p>
                  <p className="font-semibold text-sm md:text-base">{event.capacity}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Inscritos: {event.currentEnrollments}/{event.capacity}</h2>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 md:h-4">
                  <div className="h-3 md:h-4 rounded-full bg-blue-500 transition-all" style={{width: pct + '%'}} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-4 md:p-6 sticky top-20">
              {isEnrolled ? (
                <>
                  <div className="p-3 md:p-4 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4">
                    <p className="font-semibold text-green-800 dark:text-green-200 text-sm md:text-base">✓ Você está inscrito</p>
                  </div>
                  <button onClick={handleUnenroll} disabled={enrolling} className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm md:text-base transition">
                    {enrolling ? 'Processando...' : 'Desinscrever'}
                  </button>
                </>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm md:text-base transition">
                  {enrolling ? 'Processando...' : 'Inscrever-se'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}