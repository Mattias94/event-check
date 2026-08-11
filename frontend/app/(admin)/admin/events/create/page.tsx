'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminEventForm from '../../../../../components/admin/AdminEventForm'
import { createEvent } from '../../../../../lib/events'
import { getCurrentUserId } from '../../../../../lib/auth-guard'
import { EventCreationData } from '../../../../../lib/schemas'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: EventCreationData) {
    setLoading(true)
    setError(null)
    try {
      const adminId = getCurrentUserId()
      if (!adminId) {
        setError('Usuário não autenticado')
        return
      }

      await createEvent(adminId, data)
      router.push('/admin/events')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <button
            onClick={() => router.back()}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Criar Novo Evento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <AdminEventForm onSubmit={handleSubmit} loading={loading} error={error} />
      </main>
    </div>
  )
}
