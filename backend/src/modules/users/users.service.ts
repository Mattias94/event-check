import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { EnrollmentRecord, User } from '../../common/domain.types'
import { EnrollmentsRepository } from '../enrollments/enrollments.repository'
import { EventsRepository } from '../events/events.repository'
import { UsersRepository } from './users.repository'
import { CreateUserDto } from './dtos/create-user.dto'

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly eventsRepository: EventsRepository,
  ) {}

  listUsers(): Omit<User, 'password'>[] {
    return this.usersRepository.findAll().map((user) => this.withoutPassword(user))
  }

  getUserById(id: string): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    return this.withoutPassword(user)
  }

  /**
   * Retorna IDs únicos de usuários que possuem ao menos uma inscrição.
   * Segue o comportamento original: a busca de usuários do admin é baseada
   * em quem já se inscreveu em algum evento, não na lista completa de contas.
   */
  private getAllUniqueUserIds(): string[] {
    const enrollments = this.enrollmentsRepository.findAll()
    return Array.from(new Set(enrollments.map((enrollment) => enrollment.userId))).sort()
  }

  searchUsers(query: string): string[] {
    const allUserIds = this.getAllUniqueUserIds()
    if (!query.trim()) {
      return allUserIds
    }

    const lowerQuery = query.toLowerCase()
    return allUserIds.filter((userId) => userId.toLowerCase().includes(lowerQuery))
  }

  createUser(dto: CreateUserDto): Omit<User, 'password'> {
    const existingUser = this.usersRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado')
    }

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      dob: dto.dob,
      role: dto.role ?? 'user',
    })

    return this.withoutPassword(user)
  }

  getEnrollmentStats(userId: string) {
    const enrollments: EnrollmentRecord[] = this.enrollmentsRepository.findByUserId(userId)

    const enrollmentDetails = enrollments.map((enrollment) => {
      const event = this.eventsRepository.findById(enrollment.eventId)
      return {
        eventId: enrollment.eventId,
        eventTitle: event?.title ?? 'Evento deletado',
        enrolledAt: enrollment.enrolledAt,
        eventStatus: event?.status ?? 'deleted',
        eventDate: event?.date ?? '',
        eventTime: event?.time ?? '',
      }
    })

    return {
      totalEnrollments: enrollmentDetails.length,
      enrollments: enrollmentDetails,
    }
  }

  updatePasswordByEmail(email: string, password: string): void {
    const updated = this.usersRepository.updatePassword(email, password)
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado')
    }
  }

  private withoutPassword(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user
    return safeUser
  }
}
