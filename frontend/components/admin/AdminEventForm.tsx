'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import EventCoverImage from '../EventCoverImage'
import TimeField from './TimeField'
import CapacityField from './CapacityField'
import Input from '../ui/Input'
import Select from '../ui/Select'
import DateField from '../ui/DateField'
import LocationField from '../ui/LocationField'
import Textarea from '../ui/Textarea'
import { FormAlert } from '../ui/FormAlert'
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

const EVENT_FORM_FIELDS = [
  'title',
  'description',
  'category',
  'date',
  'time',
  'capacity',
  'location',
] as const

const EVENT_FIELD_LABELS: Record<(typeof EVENT_FORM_FIELDS)[number], string> = {
  title: 'Título do Evento',
  description: 'Descrição',
  category: 'Categoria',
  date: 'Data',
  time: 'Horário',
  capacity: 'Capacidade',
  location: 'Localização',
}

const EVENT_FIELD_ANCHORS: Record<(typeof EVENT_FORM_FIELDS)[number], string> = {
  title: 'title',
  description: 'event-description',
  category: 'event-category',
  date: 'event-date',
  time: 'event-time',
  capacity: 'event-capacity',
  location: 'event-location',
}

const EMPTY_EVENT_VALUES = {
  title: '',
  description: '',
  category: '',
  date: '',
  time: '',
  location: '',
  capacity: undefined as number | undefined,
  coverImageUrl: null,
  latitude: null,
  longitude: null,
  placeId: null,
}

function scrollToField(field: (typeof EVENT_FORM_FIELDS)[number]) {
  requestAnimationFrame(() => {
    document.getElementById(EVENT_FIELD_ANCHORS[field])?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  })
}

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
    watch,
    formState: { errors, isSubmitted },
  } = useForm<EventCreationData>({
    resolver: zodResolver(schema),
    reValidateMode: 'onChange',
    shouldFocusError: false,
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      date: initialData.date,
      time: initialData.time,
      location: initialData.location,
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      placeId: initialData.placeId ?? null,
      capacity: initialData.capacity,
      coverImageUrl: initialData.coverImageUrl ?? null,
    } : EMPTY_EVENT_VALUES,
  })

  const validationIssues = EVENT_FORM_FIELDS
    .filter((key) => errors[key]?.message)
    .map((key) => ({
      key,
      label: EVENT_FIELD_LABELS[key],
      message: errors[key]?.message as string,
    }))

  const latitude = watch('latitude')
  const longitude = watch('longitude')

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

  function handleInvalid(fieldErrors: FieldErrors<EventCreationData>) {
    const firstField = EVENT_FORM_FIELDS.find((key) => fieldErrors[key]?.message)
    if (firstField) scrollToField(firstField)
  }

  return (
    <Card className="w-full min-w-0 overflow-visible p-4 md:p-6">
      {initialData && (
        <h2 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
          Editar Evento
        </h2>
      )}

      {readOnly && (
        <FormAlert variant="warning" className="mb-4">
          Este evento está {initialData?.status === 'cancelled' ? 'cancelado' : 'finalizado'} e não pode ser editado.
        </FormAlert>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit, handleInvalid)} noValidate>
        {isSubmitted && validationIssues.length > 0 && (
          <FormAlert
            variant="error"
            title={
              validationIssues.length === 1
                ? '1 campo precisa de atenção'
                : `${validationIssues.length} campos precisam de atenção`
            }
          >
            <ul className="space-y-1.5">
              {validationIssues.map(({ key, label, message }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => scrollToField(key)}
                    className="w-full text-left underline-offset-2 hover:underline"
                  >
                    <span className="font-medium">{label}:</span> {message}
                  </button>
                </li>
              ))}
            </ul>
          </FormAlert>
        )}

        <Input
          id="title"
          label="Título do Evento"
          name="title"
          placeholder="Digite o título"
          disabled={readOnly}
          required
          {...register('title')}
          error={errors.title?.message}
        />

        <Textarea
          id="event-description"
          label="Descrição"
          placeholder="Digite uma descrição detalhada do evento"
          rows={4}
          required
          disabled={readOnly}
          error={errors.description?.message}
          {...register('description')}
        />

        <fieldset className="min-w-0 space-y-4 overflow-visible rounded-lg border border-border p-4 md:p-5">
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
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateField
                  id="event-date"
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={minDate}
                  required
                  allowManualInput
                  calendarSize="compact"
                  showLabelIcon
                  hint="Digite ou selecione — não agende no passado"
                  showFormatHint={false}
                  disabled={readOnly}
                  error={errors.date?.message}
                />
              )}
            />
            </div>

            <div className="min-w-0">
            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <TimeField
                  id="event-time"
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={readOnly}
                  required
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
              {...register('capacity', {
                setValueAs: (value) => {
                  if (value === '' || value === null || value === undefined) return undefined
                  const parsed = Number(value)
                  return Number.isNaN(parsed) ? undefined : parsed
                },
              })}
            />
            </div>
          </div>
        </fieldset>

        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <LocationField
              id="event-location"
              ref={field.ref}
              label="Localização"
              value={field.value ?? ''}
              latitude={latitude ?? null}
              longitude={longitude ?? null}
              onChange={(selection) => {
                field.onChange(selection.location)
                setValue('latitude', selection.latitude ?? null)
                setValue('longitude', selection.longitude ?? null)
                setValue('placeId', selection.placeId ?? null)
              }}
              onBlur={field.onBlur}
              required
              disabled={readOnly}
              error={errors.location?.message}
              hint="Busque o endereço no mapa ou digite manualmente"
            />
          )}
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

        {error && <FormAlert variant="error">{error}</FormAlert>}

        {success && <FormAlert variant="success">{success}</FormAlert>}

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
