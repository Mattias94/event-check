import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventsRepository } from '../events/events.repository'
import { EnrollmentsRepository } from './enrollments.repository'

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly eventsRepository: EventsRepository,
  ) {}

  listByEvent(eventId: string) {
    const event = this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    return this.enrollmentsRepository.findByEventId(eventId)
  }

  isEnrolled(userId: string, eventId: string): boolean {
    return this.enrollmentsRepository.findByUserAndEvent(userId, eventId) !== null
  }

  enroll(userId: string, eventId: string) {
    const event = this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    if (event.status === 'cancelled') {
      throw new BadRequestException('Evento foi cancelado')
    }

    if (event.status === 'finished') {
      throw new BadRequestException('Evento já foi finalizado')
    }

    if (this.enrollmentsRepository.findByUserAndEvent(userId, eventId)) {
      throw new BadRequestException('Você já está inscrito neste evento')
    }

    if (event.currentEnrollments >= event.capacity) {
      throw new BadRequestException('Evento está com todas as vagas preenchidas')
    }

    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      throw new BadRequestException('Não é possível se inscrever em eventos no passado')
    }

    const enrollment = this.enrollmentsRepository.create(userId, eventId)
    this.eventsRepository.save({
      ...event,
      currentEnrollments: event.currentEnrollments + 1,
    })

    return enrollment
  }

  unenroll(userId: string, eventId: string) {
    const event = this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    const removed = this.enrollmentsRepository.delete(userId, eventId)
    if (!removed) {
      throw new NotFoundException('Inscrição não encontrada')
    }

    this.eventsRepository.save({
      ...event,
      currentEnrollments: Math.max(0, event.currentEnrollments - 1),
    })

    return { success: true }
  }
}
