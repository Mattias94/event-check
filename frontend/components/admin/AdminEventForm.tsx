'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { eventCreationSchema, EventCreationData } from '../../lib/schemas'
import { Event } from '../../lib/types'

interface AdminEventFormProps {
  initialData?: Event
  onSubmit: (data: EventCreationData) => Promise<void>
  loading?: boolean
  error?: string | null
}

const CATEGORIES = ['Tecnologia', 'Negócios', 'Educação', 'Networking', 'Saúde', 'Outras']

export default function AdminEventForm({
  initialData,
  onSubmit,
  loading = false,
  error = null,
}: AdminEventFormProps) {
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EventCreationData>({
    resolver: zodResolver(eventCreationSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      date: initialData.date,
      time: initialData.time,
      location: initialData.location,
      capacity: initialData.capacity,
    } : undefined,
  })

  const capacityValue = watch('capacity')

  async function handleFormSubmit(data: EventCreationData) {
    setSuccess(null)
    try {
      await onSubmit(data)
      setSuccess(initialData ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err)
    }
  }

  return (
    <div className="card p-4 md:p-6 w-full">
      <h1 className="text-xl md:text-2xl font-semibold mb-6 text-slate-900 dark:text-white">
        {initialData ? 'Editar Evento' : 'Criar Novo Evento'}
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <Input
          label="Título do Evento"
          name="title"
          placeholder="Digite o título"
          {...register('title')}
          error={errors.title?.message as string | undefined}
        />

        <div>
          <label className="block text-sm md:text-xs font-medium mb-2 md:mb-1">Descrição</label>
          <textarea
            {...register('description')}
            placeholder="Digite uma descrição detalhada do evento"
            className="w-full px-4 py-3 md:px-3 md:py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-base md:text-sm"
            rows={4}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm md:text-xs font-medium mb-2 md:mb-1">Categoria</label>
          <select
            {...register('category')}
            className="w-full px-4 py-3 md:px-3 md:py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-base md:text-sm"
          >
            <option value="">Selecione uma categoria</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data"
            name="date"
            type="date"
            {...register('date')}
            error={errors.date?.message as string | undefined}
          />

          <Input
            label="Horário"
            name="time"
            type="time"
            {...register('time')}
            error={errors.time?.message as string | undefined}
          />
        </div>

        <Input
          label="Localização"
          name="location"
          placeholder="Digite o local do evento"
          {...register('location')}
          error={errors.location?.message as string | undefined}
        />

        <Input
          label="Capacidade (número de vagas)"
          name="capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
          error={errors.capacity?.message as string | undefined}
        />

        {initialData && capacityValue < initialData.currentEnrollments && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
            ⚠️ Capacidade não pode ser menor que inscritos atuais ({initialData.currentEnrollments})
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 flex items-center gap-2 text-sm">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : initialData ? 'Atualizar Evento' : 'Criar Evento'}
          </Button>
        </div>
      </form>
    </div>
  )
}
