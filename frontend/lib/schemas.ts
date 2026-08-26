import { z } from 'zod'
import { MAX_EVENT_CAPACITY } from './event-categories'

const todayString = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().slice(0, 10)
}

const capacitySchema = z
  .number({
    required_error: 'Informe a capacidade',
    invalid_type_error: 'Informe um número válido',
  })
  .int('A capacidade deve ser um número inteiro')
  .min(1, 'Capacidade deve ser no mínimo 1')
  .max(MAX_EVENT_CAPACITY, `Capacidade máxima: ${MAX_EVENT_CAPACITY.toLocaleString('pt-BR')}`)

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
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Data não pode ser no passado'),
  time: z.string({ required_error: 'Selecione um horário' })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use o formato HH:MM (24 horas, ex.: 14:30)')
    .transform((value) => value.slice(0, 5)),
  location: z.string({ required_error: 'Campo obrigatório' })
    .min(3, 'Localização deve ter no mínimo 3 caracteres'),
  capacity: capacitySchema,
  coverImageUrl: z.string().nullable().optional(),
})

export function createEventUpdateSchema(currentEnrollments = 0) {
  return eventCreationSchema.extend({
    capacity: capacitySchema.min(
      Math.max(1, currentEnrollments),
      currentEnrollments > 0
        ? `Capacidade não pode ser menor que ${currentEnrollments} inscrito(s)`
        : 'Capacidade deve ser no mínimo 1',
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
