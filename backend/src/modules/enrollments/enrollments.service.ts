import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import * as QRCode from 'qrcode'
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

    const enrollments = await this.enrollmentsRepository.findByEventId(eventId)

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const user = await this.usersRepository.findById(enrollment.userId)
        return {
          ...enrollment,
          userName: user?.name ?? enrollment.userId,
          userEmail: user?.email ?? '—',
        }
      }),
    )
  }

  /**
   * Lista as inscrições do usuário com os dados do evento e o QR code de
   * check-in (imagem em data URL), para a área "Minhas Inscrições".
   */
  async listByUserWithDetails(userId: string) {
    const enrollments = await this.enrollmentsRepository.findByUserId(userId)

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const event = await this.eventsRepository.findById(enrollment.eventId)

        const qrToken = this.checkInTokenService.sign({
          enrollmentId: enrollment.id,
          userId: enrollment.userId,
          eventId: enrollment.eventId,
          checkInToken: enrollment.checkInToken,
        })

        const qrDataUrl = await QRCode.toDataURL(qrToken, {
          width: 320,
          errorCorrectionLevel: 'M',
          margin: 2,
        })

        return {
          id: enrollment.id,
          eventId: enrollment.eventId,
          enrolledAt: enrollment.enrolledAt,
          checkedInAt: enrollment.checkedInAt,
          event,
          qrDataUrl,
        }
      }),
    )
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

    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      throw new BadRequestException('Não é possível se inscrever em eventos no passado')
    }

    // A decisão final é do banco: reserva de vaga com update condicional
    // atômico + constraint única (userId, eventId). Isso elimina as corridas
    // de inscrição duplicada e de estouro de capacidade em requisições
    // simultâneas — as checagens acima existem só para mensagens amigáveis.
    const attempt = await this.enrollmentsRepository.enrollAtomically(userId, eventId)

    if (attempt.status === 'duplicate') {
      throw new BadRequestException('Você já está inscrito neste evento')
    }

    if (attempt.status === 'unavailable') {
      throw new BadRequestException('Evento está com todas as vagas preenchidas')
    }

    const enrollment = attempt.enrollment

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

    const removed = await this.enrollmentsRepository.deleteAndReleaseSpot(userId, eventId)
    if (!removed) {
      throw new NotFoundException('Inscrição não encontrada')
    }

    return { success: true }
  }
}
