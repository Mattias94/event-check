import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { EnrollmentRecord } from '../../common/domain.types'
import { PrismaService } from '../../common/prisma.service'
import { Prisma } from '../../generated/prisma/client'
import type { EnrollmentModel as PrismaEnrollment } from '../../generated/prisma/models'

/** Resultado da tentativa atômica de inscrição. */
export type EnrollAttemptResult =
  | { status: 'created'; enrollment: EnrollmentRecord }
  | { status: 'duplicate' }
  | { status: 'unavailable' }

/** Erro sentinela usado para abortar a transação quando não há vagas. */
class EventUnavailableError extends Error {}

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(enrollment: PrismaEnrollment): EnrollmentRecord {
    return {
      id: enrollment.id,
      userId: enrollment.userId,
      eventId: enrollment.eventId,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      checkInToken: enrollment.checkInToken,
      checkedInAt: enrollment.checkedInAt ? enrollment.checkedInAt.toISOString() : null,
    }
  }

  async findAll(): Promise<EnrollmentRecord[]> {
    const enrollments = await this.prisma.enrollment.findMany()
    return enrollments.map((enrollment) => this.toDomain(enrollment))
  }

  async findByUserId(userId: string): Promise<EnrollmentRecord[]> {
    const enrollments = await this.prisma.enrollment.findMany({ where: { userId } })
    return enrollments.map((enrollment) => this.toDomain(enrollment))
  }

  async findByEventId(eventId: string): Promise<EnrollmentRecord[]> {
    const enrollments = await this.prisma.enrollment.findMany({ where: { eventId } })
    return enrollments.map((enrollment) => this.toDomain(enrollment))
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<EnrollmentRecord | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_eventId: { userId, eventId } },
    })

    return enrollment ? this.toDomain(enrollment) : null
  }

  async findByCheckInToken(checkInToken: string): Promise<EnrollmentRecord | null> {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { checkInToken } })
    return enrollment ? this.toDomain(enrollment) : null
  }

  async create(userId: string, eventId: string): Promise<EnrollmentRecord> {
    const created = await this.prisma.enrollment.create({
      data: {
        userId,
        eventId,
        checkInToken: randomUUID(),
      },
    })

    return this.toDomain(created)
  }

  /**
   * Inscreve o usuário de forma atômica, segura contra corridas:
   *
   * 1. Dentro de uma transação, "reserva" a vaga com um UPDATE condicional
   *    (`currentEnrollments < capacity` avaliado pelo próprio Postgres, que
   *    serializa updates na mesma linha) — impossível estourar a capacidade
   *    mesmo com inscrições simultâneas.
   * 2. Cria a inscrição; a constraint única (userId, eventId) do banco
   *    garante no máximo uma inscrição por usuário/evento. Violações (P2002)
   *    revertem a transação, devolvendo a vaga reservada.
   */
  async enrollAtomically(userId: string, eventId: string): Promise<EnrollAttemptResult> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.event.updateMany({
          where: {
            id: eventId,
            status: 'active',
            currentEnrollments: { lt: tx.event.fields.capacity },
          },
          data: { currentEnrollments: { increment: 1 } },
        })

        if (claimed.count === 0) {
          throw new EventUnavailableError()
        }

        return tx.enrollment.create({
          data: {
            userId,
            eventId,
            checkInToken: randomUUID(),
          },
        })
      })

      return { status: 'created', enrollment: this.toDomain(created) }
    } catch (error) {
      if (error instanceof EventUnavailableError) {
        return { status: 'unavailable' }
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { status: 'duplicate' }
      }

      throw error
    }
  }

  /**
   * Remove a inscrição e devolve a vaga na mesma transação, com decremento
   * atômico (nunca abaixo de zero).
   */
  async deleteAndReleaseSpot(userId: string, eventId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.enrollment.deleteMany({ where: { userId, eventId } })
      if (removed.count === 0) {
        return false
      }

      await tx.event.updateMany({
        where: { id: eventId, currentEnrollments: { gt: 0 } },
        data: { currentEnrollments: { decrement: 1 } },
      })

      return true
    })
  }

  async markCheckedIn(enrollmentId: string): Promise<EnrollmentRecord | null> {
    const existing = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } })
    if (!existing) {
      return null
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { checkedInAt: new Date() },
    })

    return this.toDomain(updated)
  }

  async delete(userId: string, eventId: string): Promise<boolean> {
    const result = await this.prisma.enrollment.deleteMany({
      where: { userId, eventId },
    })

    return result.count > 0
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await this.prisma.enrollment.deleteMany({ where: { eventId } })
  }
}
