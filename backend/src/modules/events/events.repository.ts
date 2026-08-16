import { Injectable } from '@nestjs/common'
import { Event, EventFilters } from '../../common/domain.types'
import { PrismaService } from '../../common/prisma.service'
import type { EventModel as PrismaEvent } from '../../generated/prisma/models'

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(event: PrismaEvent): Event {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      currentEnrollments: event.currentEnrollments,
      status: event.status,
      createdBy: event.createdBy,
    }
  }

  async findAll(): Promise<Event[]> {
    const events = await this.prisma.event.findMany()
    return events.map((event) => this.toDomain(event))
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({ where: { id } })
    return event ? this.toDomain(event) : null
  }

  async findByAdmin(adminId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({ where: { createdBy: adminId } })
    return events.map((event) => this.toDomain(event))
  }

  async findCategories(): Promise<string[]> {
    const rows = await this.prisma.event.findMany({
      select: { category: true },
      distinct: ['category'],
    })

    return rows.map((row) => row.category).sort()
  }

  async create(event: Omit<Event, 'id' | 'currentEnrollments'>): Promise<Event> {
    const created = await this.prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        category: event.category,
        date: event.date,
        time: event.time,
        location: event.location,
        capacity: event.capacity,
        status: event.status,
        createdBy: event.createdBy,
      },
    })

    return this.toDomain(created)
  }

  async save(updatedEvent: Event): Promise<Event> {
    const saved = await this.prisma.event.update({
      where: { id: updatedEvent.id },
      data: {
        title: updatedEvent.title,
        description: updatedEvent.description,
        category: updatedEvent.category,
        date: updatedEvent.date,
        time: updatedEvent.time,
        location: updatedEvent.location,
        capacity: updatedEvent.capacity,
        currentEnrollments: updatedEvent.currentEnrollments,
        status: updatedEvent.status,
      },
    })

    return this.toDomain(saved)
  }

  async delete(eventId: string): Promise<void> {
    await this.prisma.event.deleteMany({ where: { id: eventId } })
  }

  async applyFilters(filters?: EventFilters): Promise<Event[]> {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const activeEvents = await this.prisma.event.findMany({ where: { status: 'active' } })

    let events = activeEvents.map((event) => this.toDomain(event)).filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
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
