import { z } from 'zod'
import { parseIsoDateLocal, todayIsoLocal } from './date-utils'
import { MAX_EVENT_CAPACITY } from './event-categories'

const todayString = todayIsoLocal

const capacitySchema = z
  .number({
    required_error: 'Informe a capacidade',
    invalid_type_error: 'Informe a capacidade',
  })
  .int('A capacidade deve ser um número inteiro')
  .min(1, 'Capacidade deve ser no mínimo 1')
  .max(MAX_EVENT_CAPACITY, `Capacidade máxima: ${MAX_EVENT_CAPACITY.toLocaleString('pt-BR')}`)

const capacityInputSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'number' && Number.isNaN(value)) return undefined
    return value
  },
  capacitySchema,
)

export const eventCreationSchema = z.object({
  title: z.string({ required_error: 'Campo obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string({ required_error: 'Campo obrigatório' })
    .min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  category: z
    .string({ required_error: 'Selecione uma categoria' })
    .min(1, 'Selecione uma categoria'),
  date: z.string({ required_error: 'Selecione uma data' })
    .refine((date) => {
      const selectedDate = parseIsoDateLocal(date)
      const today = parseIsoDateLocal(todayIsoLocal())
      if (!selectedDate || !today) return false
      return selectedDate >= today
    }, 'Data não pode ser no passado'),
  time: z.string({ required_error: 'Selecione um horário' })
    .min(1, 'Selecione um horário')
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use o formato HH:MM (24 horas, ex.: 14:30)')
    .transform((value) => value.slice(0, 5)),
  location: z.string({ required_error: 'Campo obrigatório' })
    .min(3, 'Localização deve ter no mínimo 3 caracteres'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  placeId: z.string().nullable().optional(),
  capacity: capacityInputSchema,
  coverImageUrl: z.string().nullable().optional(),
})

export function createEventUpdateSchema(currentEnrollments = 0) {
  const minCapacity = Math.max(1, currentEnrollments)
  return eventCreationSchema.extend({
    capacity: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) return undefined
        if (typeof value === 'number' && Number.isNaN(value)) return undefined
        return value
      },
      capacitySchema.min(
        minCapacity,
        currentEnrollments > 0
          ? `Capacidade não pode ser menor que ${currentEnrollments} inscrito(s)`
          : 'Capacidade deve ser no mínimo 1',
      ),
    ),
  })
}

export const eventUpdateSchema = createEventUpdateSchema()

export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type EventCreationData = z.infer<typeof eventCreationSchema>
export type EventUpdateData = z.infer<typeof eventUpdateSchema>
export type EventFiltersData = z.infer<typeof eventFiltersSchema>

export { todayString }
