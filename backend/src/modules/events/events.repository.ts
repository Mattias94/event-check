import { Injectable } from '@nestjs/common'
import { Event, EventFilters } from '../../common/domain.types'
import { InMemoryStore } from '../../common/in-memory-store'

@Injectable()
export class EventsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findAll(): Event[] {
    return [...this.store.events]
  }

  findById(id: string): Event | null {
    return this.store.events.find((event) => event.id === id) ?? null
  }

  findByAdmin(adminId: string): Event[] {
    return this.store.events.filter((event) => event.createdBy === adminId)
  }

  findCategories(): string[] {
    return Array.from(new Set(this.store.events.map((event) => event.category))).sort()
  }

  create(event: Omit<Event, 'id' | 'currentEnrollments'>): Event {
    const created: Event = {
      ...event,
      id: Date.now().toString(),
      currentEnrollments: 0,
    }

    this.store.events.push(created)
    return created
  }

  save(updatedEvent: Event): Event {
    const index = this.store.events.findIndex((event) => event.id === updatedEvent.id)
    if (index !== -1) {
      this.store.events[index] = updatedEvent
    }

    return updatedEvent
  }

  delete(eventId: string): void {
    this.store.events = this.store.events.filter((event) => event.id !== eventId)
  }

  applyFilters(filters?: EventFilters): Event[] {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    let events = this.findAll().filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return event.status === 'active' && eventDate >= now
    })

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      events = events.filter((event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower),
      )
    }

    if (filters?.category) {
      events = events.filter((event) => event.category === filters.category)
    }

    if (filters?.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      events = events.filter((event) => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= startDate
      })
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      events = events.filter((event) => {
        const eventDate = new Date(event.date)
        eventDate.setHours(23, 59, 59, 999)
        return eventDate <= endDate
      })
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
}
