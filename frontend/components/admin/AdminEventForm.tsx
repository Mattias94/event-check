'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import EventCoverImage from '../EventCoverImage'
import TimeField from './TimeField'
import CapacityField from './CapacityField'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { Card } from '../ui/Card'
import { createEventUpdateSchema, eventCreationSchema, EventCreationData, todayString } from '../../lib/schemas'
import { compressImageToDataUrl, formatMaxUploadSize, MAX_UPLOAD_FILE_SIZE } from '../../lib/image'
import { DEFAULT_EVENT_CATEGORIES } from '../../lib/event-categories'
import { getCategories } from '../../lib/events'
import { Event } from '../../lib/types'

interface AdminEventFormProps {
  initialData?: Event
  onSubmit: (data: EventCreationData) => Promise<void>
  loading?: boolean
  error?: string | null
  readOnly?: boolean
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AdminEventForm({
  initialData,
  onSubmit,
  loading = false,
  error = null,
  readOnly = false,
}: AdminEventFormProps) {
  const [success, setSuccess] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImageUrl ?? null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [coverProcessing, setCoverProcessing] = useState(false)
  const [categories, setCategories] = useState<string[]>([...DEFAULT_EVENT_CATEGORIES])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const minDate = todayString()
  const minEnrolled = initialData?.currentEnrollments ?? 0

  const schema = useMemo(
    () => (initialData ? createEventUpdateSchema(minEnrolled) : eventCreationSchema),
    [initialData, minEnrolled],
  )

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EventCreationData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      date: initialData.date,
      time: initialData.time,
      location: initialData.location,
      capacity: initialData.capacity,
      coverImageUrl: initialData.coverImageUrl ?? null,
    } : {
      coverImageUrl: null,
    },
  })

  useEffect(() => {
    let active = true
    getCategories()
      .then((items) => {
        if (active) setCategories(items)
      })
      .catch(() => {
        /* mantém fallback local */
      })
    return () => {
      active = false
    }
  }, [])

  async function handleCoverFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setCoverError(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setCoverError('Formato inválido. Use JPEG, PNG ou WebP.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      setCoverError(`Imagem muito grande. Máximo de ${formatMaxUploadSize()}.`)
      event.target.value = ''
      return
    }

    setCoverProcessing(true)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      setCoverPreview(dataUrl)
      setValue('coverImageUrl', dataUrl)
    } catch (err: unknown) {
      setCoverError(err instanceof Error ? err.message : 'Não foi possível processar a imagem.')
      event.target.value = ''
    } finally {
      setCoverProcessing(false)
    }
  }

  function handleRemoveCover() {
    setCoverPreview(null)
    setValue('coverImageUrl', null)
    setCoverError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleFormSubmit(data: EventCreationData) {
    setSuccess(null)
    try {
      await onSubmit({ ...data, coverImageUrl: coverPreview })
      setSuccess(initialData ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: unknown) {
      console.error('Erro ao salvar evento:', err)
    }
  }

  return (
    <Card className="w-full min-w-0 p-4 md:p-6">
      {initialData && (
        <h2 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
          Editar Evento
        </h2>
      )}

      {readOnly && (
        <div className="mb-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
          Este evento está {initialData?.status === 'cancelled' ? 'cancelado' : 'finalizado'} e não pode ser editado.
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Input
          label="Título do Evento"
          name="title"
          placeholder="Digite o título"
          disabled={readOnly}
          required
          {...register('title')}
          error={errors.title?.message}
        />

        <div>
          <label htmlFor="event-description" className="mb-1.5 block text-sm font-medium text-foreground">
            Descrição
          </label>
          <textarea
            id="event-description"
            {...register('description')}
            disabled={readOnly}
            placeholder="Digite uma descrição detalhada do evento"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? 'event-description-error' : undefined}
            className="min-h-[6rem] w-full rounded-md border border-input bg-card px-3 py-2.5 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            rows={4}
          />
          {errors.description && (
            <p id="event-description-error" role="alert" className="mt-1.5 text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <fieldset className="min-w-0 space-y-4 overflow-hidden rounded-lg border border-border p-4 md:p-5">
          <legend className="px-1 text-base font-semibold text-foreground">
            Informações do evento
          </legend>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="min-w-0">
            <Select
              label="Categoria"
              id="event-category"
              disabled={readOnly}
              required
              hint="Categoria exibida nos filtros"
              error={errors.category?.message}
              {...register('category')}
            >
              <option value="" disabled>
                Selecione
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            </div>

            <div className="min-w-0">
            <Input
              label="Data"
              name="date"
              type="date"
              min={minDate}
              required
              hint="Não agende no passado"
              className="date-input w-full"
              disabled={readOnly}
              {...register('date')}
              error={errors.date?.message}
            />
            </div>

            <div className="min-w-0">
            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <TimeField
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={readOnly}
                  error={errors.time?.message}
                />
              )}
            />
            </div>

            <div className="min-w-0">
            <CapacityField
              id="event-capacity"
              disabled={readOnly}
              required
              minEnrolled={minEnrolled}
              error={errors.capacity?.message}
              {...register('capacity', { valueAsNumber: true })}
            />
            </div>
          </div>
        </fieldset>

        <Input
          label="Localização"
          name="location"
          placeholder="Digite o local do evento"
          disabled={readOnly}
          required
          {...register('location')}
          error={errors.location?.message}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Imagem de capa
          </label>

          {coverPreview ? (
            <div className="relative overflow-hidden rounded-md border border-border">
              <EventCoverImage src={coverPreview} maxHeightClass="max-h-56" alt="Pré-visualização da capa" />
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCover}
                  className="absolute right-2 top-2 bg-background/90"
                >
                  <X aria-hidden="true" />
                  Remover
                </Button>
              )}
            </div>
          ) : (
            !readOnly && (
              <button
                type="button"
                onClick={() => !coverProcessing && fileInputRef.current?.click()}
                disabled={coverProcessing}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 disabled:cursor-wait disabled:opacity-60"
              >
                <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {coverProcessing
                    ? 'Otimizando imagem em alta qualidade...'
                    : `Clique para enviar (JPEG, PNG ou WebP — até ${formatMaxUploadSize()})`}
                </span>
              </button>
            )
          )}

          {!readOnly && coverPreview && (
            <button
              type="button"
              onClick={() => !coverProcessing && fileInputRef.current?.click()}
              disabled={coverProcessing}
              className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              <ImagePlus className="size-4" aria-hidden="true" />
              Trocar imagem
            </button>
          )}

          {!readOnly && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleCoverFileChange}
            />
          )}

          {coverError && (
            <p role="alert" className="mt-1.5 text-sm text-destructive">
              {coverError}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
            <span>{success}</span>
          </div>
        )}

        {!readOnly && (
          <div className="flex gap-3">
            <Button type="submit" disabled={loading || coverProcessing} loading={loading} className="w-full sm:w-auto">
              {coverProcessing ? 'Processando imagem...' : initialData ? 'Atualizar Evento' : 'Criar Evento'}
            </Button>
          </div>
        )}
      </form>
    </Card>
  )
}
