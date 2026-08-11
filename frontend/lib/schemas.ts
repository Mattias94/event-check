import { z } from 'zod'

export const eventCreationSchema = z.object({
  title: z.string({ required_error: 'Campo obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string({ required_error: 'Campo obrigatório' })
    .min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  category: z.string({ required_error: 'Selecione uma categoria' }),
  date: z.string({ required_error: 'Selecione uma data' })
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Data não pode ser no passado'),
  time: z.string({ required_error: 'Selecione um horário' })
    .regex(/^\d{2}:\d{2}$/, 'Formato deve ser HH:MM'),
  location: z.string({ required_error: 'Campo obrigatório' })
    .min(3, 'Localização deve ter no mínimo 3 caracteres'),
  capacity: z.number({ required_error: 'Campo obrigatório' })
    .min(1, 'Capacidade deve ser maior que 0'),
})

export const eventUpdateSchema = eventCreationSchema.extend({
  capacity: z.number()
    .min(1, 'Capacidade deve ser maior que 0'),
})

export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type EventCreationData = z.infer<typeof eventCreationSchema>
export type EventUpdateData = z.infer<typeof eventUpdateSchema>
export type EventFiltersData = z.infer<typeof eventFiltersSchema>
