import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Event, EventFilters } from '../../common/domain.types'
import { EnrollmentsRepository } from '../enrollments/enrollments.repository'
import { MailService } from '../notifications/mail.service'
import { UsersRepository } from '../users/users.repository'
import { EventsRepository } from './events.repository'
import { mergeEventCategories } from '../../common/event-categories'
import { CreateEventDto } from './dtos/create-event.dto'
import { UpdateEventDto } from './dtos/update-event.dto'

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name)

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  list(filters?: EventFilters) {
    return this.eventsRepository.applyFilters(filters)
  }

  async getById(id: string): Promise<Event> {
    const event = await this.eventsRepository.findById(id)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    return event
  }

  listByAdmin(adminId: string) {
    return this.eventsRepository.findByAdmin(adminId)
  }

  async categories() {
    const fromDb = await this.eventsRepository.findCategories()
    return mergeEventCategories(fromDb)
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
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      placeId: dto.placeId ?? null,
      capacity: dto.capacity,
      coverImageUrl: dto.coverImageUrl ?? null,
      status: dto.status ?? 'active',
      createdBy: dto.createdBy,
    })
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.getById(id)

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
      latitude: dto.latitude !== undefined ? dto.latitude : event.latitude,
      longitude: dto.longitude !== undefined ? dto.longitude : event.longitude,
      placeId: dto.placeId !== undefined ? dto.placeId : event.placeId,
      capacity: dto.capacity ?? event.capacity,
      coverImageUrl: dto.coverImageUrl !== undefined ? dto.coverImageUrl : event.coverImageUrl,
    })
  }

  async delete(id: string) {
    await this.getById(id)

    await this.enrollmentsRepository.deleteByEventId(id)
    await this.eventsRepository.delete(id)
    return { success: true }
  }

  async cancel(id: string) {
    const event = await this.getById(id)

    if (event.status === 'cancelled') {
      throw new BadRequestException('Este evento já foi cancelado')
    }

    if (event.status === 'finished') {
      throw new BadRequestException('Não é possível cancelar eventos já finalizados')
    }

    const updated = await this.eventsRepository.save({
      ...event,
      status: 'cancelled',
    })

    const enrollments = await this.enrollmentsRepository.findByEventId(id)
    const emailResults = await Promise.allSettled(
      enrollments.map(async (enrollment) => {
        const user = await this.usersRepository.findById(enrollment.userId)
        if (!user) return false
        return this.mailService.sendEventCancellation(user, updated)
      }),
    )

    const emailsNotified = emailResults.filter(
      (result) => result.status === 'fulfilled' && result.value === true,
    ).length
    const emailsFailed = enrollments.length - emailsNotified

    if (emailsFailed > 0) {
      this.logger.warn(
        `Cancelamento do evento ${id}: ${emailsFailed} e-mail(s) de notificação não enviado(s)`,
      )
    } else if (emailsNotified > 0) {
      this.logger.log(`Cancelamento do evento ${id}: ${emailsNotified} inscrito(s) notificado(s)`)
    }

    return { ...updated, emailsNotified, emailsFailed }
  }
}
