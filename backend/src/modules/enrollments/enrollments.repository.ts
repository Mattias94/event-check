import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { EnrollmentRecord } from '../../common/domain.types'
import { PrismaService } from '../../common/prisma.service'
import type { EnrollmentModel as PrismaEnrollment } from '../../generated/prisma/models'

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
