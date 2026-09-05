import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { EnrollmentRecord, User } from '../../common/domain.types'
import { hashPassword } from '../../common/password'
import { EnrollmentsRepository } from '../enrollments/enrollments.repository'
import { EventsRepository } from '../events/events.repository'
import { UsersRepository } from './users.repository'
import { CreateUserDto } from './dtos/create-user.dto'
import { UpdateProfileDto } from './dtos/update-profile.dto'

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

  async searchUsers(query: string): Promise<{ id: string; name: string; email: string; role: string }[]> {
    const allUsers = (await this.usersRepository.findAll())
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

    if (!query.trim()) {
      return allUsers
    }

    const lowerQuery = query.toLowerCase()
    return allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        user.id.toLowerCase().includes(lowerQuery),
    )
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
      emailVerified: false,
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

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findById(id)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (dto.phone !== undefined && dto.phone !== null && dto.phone.trim() !== '') {
      const digits = dto.phone.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11) {
        throw new BadRequestException('Telefone inválido. Use DDD + número (10 ou 11 dígitos).')
      }
    }

    const formattedPhone =
      dto.phone === undefined
        ? undefined
        : dto.phone?.trim()
          ? this.formatPhoneBR(dto.phone)
          : null

    const updated = await this.usersRepository.updateProfile(id, {
      name: dto.name?.trim() ?? undefined,
      phone: formattedPhone,
      avatarUrl: dto.avatarUrl,
    })

    if (!updated) {
      throw new NotFoundException('Usuário não encontrado')
    }

    return this.withoutPassword(updated)
  }

  private formatPhoneBR(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return raw.trim()
  }

  private withoutPassword(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user
    return safeUser
  }
}
