import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Event, EventFilters } from '../../common/domain.types'
import { EnrollmentsRepository } from '../enrollments/enrollments.repository'
import { EventsRepository } from './events.repository'
import { CreateEventDto } from './dtos/create-event.dto'
import { UpdateEventDto } from './dtos/update-event.dto'

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
  ) {}

  list(filters?: EventFilters) {
    return this.eventsRepository.applyFilters(filters)
  }

  getById(id: string): Event {
    const event = this.eventsRepository.findById(id)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    return event
  }

  listByAdmin(adminId: string) {
    return this.eventsRepository.findByAdmin(adminId)
  }

  categories() {
    return this.eventsRepository.findCategories()
  }

  create(dto: CreateEventDto) {
    const eventDate = new Date(dto.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      throw new BadRequestException('A data do evento não pode ser no passado')
    }

    return this.eventsRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      date: dto.date,
      time: dto.time,
      location: dto.location,
      capacity: dto.capacity,
      status: dto.status ?? 'active',
      createdBy: dto.createdBy,
    })
  }

  update(id: string, dto: UpdateEventDto) {
    const event = this.getById(id)

    if (event.status === 'cancelled') {
      throw new BadRequestException('Não é possível editar eventos cancelados')
    }

    if (event.status === 'finished') {
      throw new BadRequestException('Não é possível editar eventos finalizados')
    }

    if (dto.date) {
      const eventDate = new Date(dto.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      eventDate.setHours(0, 0, 0, 0)

      if (eventDate < today) {
        throw new BadRequestException('A data do evento não pode ser no passado')
      }
    }

    if (typeof dto.capacity === 'number' && dto.capacity < event.currentEnrollments) {
      throw new BadRequestException(
        `Capacidade não pode ser menor que ${event.currentEnrollments} inscritos atuais`,
      )
    }

    return this.eventsRepository.save({
      ...event,
      title: dto.title ?? event.title,
      description: dto.description ?? event.description,
      category: dto.category ?? event.category,
      date: dto.date ?? event.date,
      time: dto.time ?? event.time,
      location: dto.location ?? event.location,
      capacity: dto.capacity ?? event.capacity,
    })
  }

  delete(id: string) {
    const event = this.getById(id)
    if (event.currentEnrollments > 0) {
      throw new BadRequestException(
        `Não é possível deletar este evento pois possui ${event.currentEnrollments} inscrito(s).`,
      )
    }

    this.enrollmentsRepository.deleteByEventId(id)
    this.eventsRepository.delete(id)
    return { success: true }
  }

  cancel(id: string) {
    const event = this.getById(id)

    if (event.status === 'cancelled') {
      throw new BadRequestException('Este evento já foi cancelado')
    }

    if (event.status === 'finished') {
      throw new BadRequestException('Não é possível cancelar eventos já finalizados')
    }

    return this.eventsRepository.save({
      ...event,
      status: 'cancelled',
    })
  }
}
