import { api } from './api'
import { getUserById } from './auth'
import { Event, EnrollmentRecord, EnrollmentWithUser, EventFilters, CheckInResult, UserEnrollmentWithQr } from './types'
import { mergeEventCategories } from './event-categories'
import { EventCreationData, EventUpdateData } from './schemas'

export async function getUpcomingEvents(filters?: EventFilters): Promise<Event[]> {
  const query = api.buildQuery({
    search: filters?.search,
    category: filters?.category,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  })
  return api.get<Event[]>(`/events${query}`)
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    return await api.get<Event>(`/events/${id}`)
  } catch (err: any) {
    if (err?.message?.includes('404') || err?.message?.toLowerCase().includes('não encontrado')) {
      return null
    }
    throw err
  }
}

export async function createEvent(adminId: string, data: EventCreationData): Promise<Event> {
  return api.post<Event>('/events', { ...data, createdBy: adminId })
}

export async function updateEvent(eventId: string, data: EventUpdateData): Promise<Event | null> {
  return api.patch<Event>(`/events/${eventId}`, data)
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await api.delete<{ success: boolean }>(`/events/${eventId}`)
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function cancelEvent(eventId: string): Promise<(Event & { emailsNotified?: number; emailsFailed?: number }) | null> {
  return api.post<Event & { emailsNotified?: number; emailsFailed?: number }>(`/events/${eventId}/cancel`)
}

export async function getEnrollments(eventId: string): Promise<EnrollmentWithUser[]> {
  return api.get<EnrollmentWithUser[]>(`/events/${eventId}/enrollments`)
}

export async function isUserEnrolled(userId: string, eventId: string): Promise<boolean> {
  const result = await api.get<{ enrolled: boolean }>(`/events/${eventId}/enrollments/${userId}`)
  return result.enrolled
}

export async function enrollUser(
  userId: string,
  eventId: string,
): Promise<{ success: boolean; error?: string; emailSent?: boolean }> {
  try {
    const result = await api.post<{ emailSent?: boolean }>(`/events/${eventId}/enrollments/${userId}`)
    return { success: true, emailSent: result.emailSent }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function unenrollUser(userId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await api.delete<{ success: boolean }>(`/events/${eventId}/enrollments/${userId}`)
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Valida o QR code lido no painel admin e registra o check-in do participante.
 * O token é o conteúdo do QR code (JWT gerado pelo backend na inscrição).
 */
export async function checkInEnrollment(eventId: string, token: string): Promise<CheckInResult> {
  return api.post<CheckInResult>(`/events/${eventId}/enrollments/check-in`, { token })
}

export async function getEventsByAdmin(adminId: string): Promise<Event[]> {
  return api.get<Event[]>(`/events/admin/${adminId}`)
}

export async function getCategories(): Promise<string[]> {
  try {
    const fromApi = await api.get<string[]>('/events/categories')
    return mergeEventCategories(fromApi)
  } catch {
    return mergeEventCategories()
  }
}

/**
 * Recupera todos os eventos em que o usuário está inscrito, combinando as
 * inscrições do usuário (que trazem o eventId) com os dados completos de
 * cada evento.
 */
export async function getEnrollmentsForUser(userId: string): Promise<Event[]> {
  const stats = await getUserEnrollmentStats(userId)
  const events = await Promise.all(
    stats.enrollments.map(enrollment => getEventById(enrollment.eventId))
  )
  return events.filter((event): event is Event => event !== null)
}

/** Inscrições do usuário com QR code de check-in (data URL). */
export async function getUserEnrollmentsWithQr(userId: string): Promise<UserEnrollmentWithQr[]> {
  return api.get<UserEnrollmentWithQr[]>(`/users/${userId}/enrollments`)
}

/**
 * Resumo de usuário com inscrições (para busca no painel admin).
 */
export interface EnrolledUserSummary {
  id: string
  name: string
  email: string
}

/** Normaliza resposta da API (objetos ou IDs legados) com nome/e-mail do cadastro. */
async function enrichUserSummaries(raw: unknown): Promise<EnrolledUserSummary[]> {
  if (!Array.isArray(raw)) return []

  return Promise.all(
    raw.map(async (item) => {
      if (typeof item === 'object' && item !== null && 'id' in item) {
        const summary = item as EnrolledUserSummary
        if (summary.name) return summary
        const user = await getUserById(summary.id)
        return {
          id: summary.id,
          name: user?.name ?? summary.id,
          email: user?.email ?? '—',
        }
      }

      const id = String(item)
      const user = await getUserById(id)
      return {
        id,
        name: user?.name ?? id,
        email: user?.email ?? '—',
      }
    }),
  )
}

/**
 * Recupera todos os usuários únicos com inscrições
 */
export async function getAllUniqueUserIds(): Promise<EnrolledUserSummary[]> {
  const raw = await api.get<unknown>('/users/search')
  return enrichUserSummaries(raw)
}

/**
 * Recupera inscrições e cancelamentos de um usuário
 */
export async function getUserEnrollmentStats(userId: string) {
  return api.get<{
    totalEnrollments: number
    enrollments: {
      eventId: string
      eventTitle: string
      enrolledAt: string
      eventStatus: string
      eventDate: string
      eventTime: string
    }[]
  }>(`/users/${userId}/stats`)
}

/**
 * Busca usuários por nome, e-mail ou ID
 */
export async function searchUsers(query: string): Promise<EnrolledUserSummary[]> {
  const raw = await api.get<unknown>(`/users/search${api.buildQuery({ q: query })}`)
  return enrichUserSummaries(raw)
}
