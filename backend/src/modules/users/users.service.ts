import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { EnrollmentRecord, User } from '../../common/domain.types'
import { hashPassword } from '../../common/password'
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

  async listUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.findAll()
    return users.map((user) => this.withoutPassword(user))
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findById(id)
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
  private async getAllUniqueUserIds(): Promise<string[]> {
    const enrollments = await this.enrollmentsRepository.findAll()
    return Array.from(new Set(enrollments.map((enrollment) => enrollment.userId))).sort()
  }

  async searchUsers(query: string): Promise<string[]> {
    const allUserIds = await this.getAllUniqueUserIds()
    if (!query.trim()) {
      return allUserIds
    }

    const lowerQuery = query.toLowerCase()
    return allUserIds.filter((userId) => userId.toLowerCase().includes(lowerQuery))
  }

  async createUser(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado')
    }

    // O papel nunca vem do cliente: contas criadas por esta rota são sempre
    // usuários comuns. Admin só existe via seed ou primeiro registro.
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: await hashPassword(dto.password),
      dob: dto.dob,
      role: 'user',
    })

    return this.withoutPassword(user)
  }

  async getEnrollmentStats(userId: string) {
    const enrollments: EnrollmentRecord[] = await this.enrollmentsRepository.findByUserId(userId)

    const enrollmentDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const event = await this.eventsRepository.findById(enrollment.eventId)
        return {
          eventId: enrollment.eventId,
          eventTitle: event?.title ?? 'Evento deletado',
          enrolledAt: enrollment.enrolledAt,
          eventStatus: event?.status ?? 'deleted',
          eventDate: event?.date ?? '',
          eventTime: event?.time ?? '',
        }
      }),
    )

    return {
      totalEnrollments: enrollmentDetails.length,
      enrollments: enrollmentDetails,
    }
  }

  async updatePasswordByEmail(email: string, password: string): Promise<void> {
    const updated = await this.usersRepository.updatePassword(email, await hashPassword(password))
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado')
    }
  }

  private withoutPassword(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user
    return safeUser
  }
}
