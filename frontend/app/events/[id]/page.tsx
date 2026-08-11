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
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <button onClick={() => router.push('/events')} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium mb-4">
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{event.title}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-6 space-y-6">
              <p className="text-slate-600 dark:text-slate-400">{event.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600">Data</p>
                  <p className="font-semibold">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600">Hora</p>
                  <p className="font-semibold">{event.time}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600">Local</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600">Capacidade</p>
                  <p className="font-semibold">{event.capacity}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-3">Inscritos: {event.currentEnrollments}/{event.capacity}</h2>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div className="h-4 rounded-full bg-blue-500" style={{width: pct + '%'}} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-4">
              {isEnrolled ? (
                <>
                  <div className="p-4 bg-green-100 rounded-lg mb-4">
                    <p className="font-semibold text-green-800">Inscrito</p>
                  </div>
                  <button onClick={handleUnenroll} disabled={enrolling} className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-bold">
                    Desinscrever
                  </button>
                </>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-bold">
                  Inscrever-se
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}