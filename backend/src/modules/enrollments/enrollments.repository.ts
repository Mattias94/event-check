import { Injectable } from '@nestjs/common'
import { EnrollmentRecord } from '../../common/domain.types'
import { InMemoryStore } from '../../common/in-memory-store'

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findAll(): EnrollmentRecord[] {
    return [...this.store.enrollments]
  }

  findByUserId(userId: string): EnrollmentRecord[] {
    return this.store.enrollments.filter((enrollment) => enrollment.userId === userId)
  }

  findByEventId(eventId: string): EnrollmentRecord[] {
    return this.store.enrollments.filter((enrollment) => enrollment.eventId === eventId)
  }

  findByUserAndEvent(userId: string, eventId: string): EnrollmentRecord | null {
    return this.store.enrollments.find(
      (enrollment) => enrollment.userId === userId && enrollment.eventId === eventId,
    ) ?? null
  }

  create(userId: string, eventId: string): EnrollmentRecord {
    const created: EnrollmentRecord = {
      id: Date.now().toString(),
      userId,
      eventId,
      enrolledAt: new Date().toISOString(),
    }

    this.store.enrollments.push(created)
    return created
  }

  delete(userId: string, eventId: string): boolean {
    const initialLength = this.store.enrollments.length
    this.store.enrollments = this.store.enrollments.filter(
      (enrollment) => !(enrollment.userId === userId && enrollment.eventId === eventId),
    )

    return this.store.enrollments.length !== initialLength
  }

  deleteByEventId(eventId: string): void {
    this.store.enrollments = this.store.enrollments.filter((enrollment) => enrollment.eventId !== eventId)
  }
}
