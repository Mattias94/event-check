import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventsRepository } from '../events/events.repository'
import { UsersRepository } from '../users/users.repository'
import { CheckInTokenService } from '../notifications/check-in-token.service'
import { MailService } from '../notifications/mail.service'
import { EnrollmentsRepository } from './enrollments.repository'

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly checkInTokenService: CheckInTokenService,
    private readonly mailService: MailService,
  ) {}

  async listByEvent(eventId: string) {
    const event = await this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    return this.enrollmentsRepository.findByEventId(eventId)
  }

  async isEnrolled(userId: string, eventId: string): Promise<boolean> {
    return (await this.enrollmentsRepository.findByUserAndEvent(userId, eventId)) !== null
  }

  async enroll(userId: string, eventId: string) {
    const event = await this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (event.status === 'cancelled') {
      throw new BadRequestException('Evento foi cancelado')
    }

    if (event.status === 'finished') {
      throw new BadRequestException('Evento já foi finalizado')
    }

    if (await this.enrollmentsRepository.findByUserAndEvent(userId, eventId)) {
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

    const enrollment = await this.enrollmentsRepository.create(userId, eventId)
    await this.eventsRepository.save({
      ...event,
      currentEnrollments: event.currentEnrollments + 1,
    })

    const qrToken = this.checkInTokenService.sign({
      enrollmentId: enrollment.id,
      userId,
      eventId,
      checkInToken: enrollment.checkInToken,
    })

    const emailSent = await this.mailService.sendEnrollmentConfirmation(user, event, qrToken)

    return { ...enrollment, emailSent }
  }

  async checkIn(eventId: string, qrToken: string) {
    const event = await this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    const payload = this.checkInTokenService.verify(qrToken)
    if (!payload) {
      throw new BadRequestException('QR code inválido ou adulterado')
    }

    const enrollment = await this.enrollmentsRepository.findByCheckInToken(payload.checkInToken)
    if (!enrollment || enrollment.id !== payload.enrollmentId) {
      throw new NotFoundException('Inscrição não encontrada para este QR code')
    }

    if (enrollment.eventId !== eventId) {
      throw new BadRequestException('Este QR code pertence a outro evento')
    }

    if (enrollment.checkedInAt) {
      throw new BadRequestException(
        `Check-in já realizado em ${new Date(enrollment.checkedInAt).toLocaleString('pt-BR')}`,
      )
    }

    const updated = await this.enrollmentsRepository.markCheckedIn(enrollment.id)
    const user = await this.usersRepository.findById(enrollment.userId)

    return {
      valid: true,
      enrollment: updated,
      participant: user ? { id: user.id, name: user.name, email: user.email } : null,
    }
  }

  async unenroll(userId: string, eventId: string) {
    const event = await this.eventsRepository.findById(eventId)
    if (!event) {
      throw new NotFoundException('Evento não encontrado')
    }

    const removed = await this.enrollmentsRepository.delete(userId, eventId)
    if (!removed) {
      throw new NotFoundException('Inscrição não encontrada')
    }

    await this.eventsRepository.save({
      ...event,
      currentEnrollments: Math.max(0, event.currentEnrollments - 1),
    })

    return { success: true }
  }
}
