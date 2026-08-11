import { api } from './api'
import { Event, EnrollmentRecord, EventFilters } from './types'
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
  } catch {
    return null
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

export async function cancelEvent(eventId: string): Promise<Event | null> {
  return api.post<Event>(`/events/${eventId}/cancel`)
}

export async function getEnrollments(eventId: string): Promise<EnrollmentRecord[]> {
  return api.get<EnrollmentRecord[]>(`/events/${eventId}/enrollments`)
}

export async function isUserEnrolled(userId: string, eventId: string): Promise<boolean> {
  const result = await api.get<{ enrolled: boolean }>(`/events/${eventId}/enrollments/${userId}`)
  return result.enrolled
}

export async function enrollUser(userId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/events/${eventId}/enrollments/${userId}`)
    return { success: true }
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

export async function getEventsByAdmin(adminId: string): Promise<Event[]> {
  return api.get<Event[]>(`/events/admin/${adminId}`)
}

export async function getCategories(): Promise<string[]> {
  return api.get<string[]>('/events/categories')
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

/**
 * Recupera todos os IDs de usuários únicos com inscrições
 */
export async function getAllUniqueUserIds(): Promise<string[]> {
  return api.get<string[]>('/users/search')
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
 * Busca usuários por ID (parcial)
 */
export async function searchUsers(query: string): Promise<string[]> {
  return api.get<string[]>(`/users/search${api.buildQuery({ q: query })}`)
}
