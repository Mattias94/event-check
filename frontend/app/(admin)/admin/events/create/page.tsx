'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminEventForm from '../../../../../components/admin/AdminEventForm'
import { createEvent } from '../../../../../lib/events'
import { getCurrentUserId, requireAdmin } from '../../../../../lib/auth-guard'
import { EventCreationData } from '../../../../../lib/schemas'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getCurrentUserId()
    if (!userId) {
      router.push('/login')
      return
    }

    if (!requireAdmin(router)) {
      return
    }
  }, [router])

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
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Criar Novo Evento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Preencha os dados abaixo para publicar um novo evento
        </p>
      </div>

      <AdminEventForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/events')}
        loading={loading}
        error={error}
      />
    </div>
  )
}
