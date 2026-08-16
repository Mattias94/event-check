import { Injectable } from '@nestjs/common'
import { PasswordResetRequest, User } from '../../common/domain.types'
import { PrismaService } from '../../common/prisma.service'
import type { UserModel as PrismaUser, PasswordResetModel as PrismaPasswordReset } from '../../generated/prisma/models'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(user: PrismaUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      dob: user.dob ?? undefined,
      role: user.role,
    }
  }

  private resetToDomain(reset: PrismaPasswordReset): PasswordResetRequest {
    return {
      email: reset.email,
      token: reset.token,
      createdAt: reset.createdAt.toISOString(),
      used: reset.used,
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany()
    return users.map((user) => this.toDomain(user))
  }

  async count(): Promise<number> {
    return this.prisma.user.count()
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    return user ? this.toDomain(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    return user ? this.toDomain(user) : null
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        dob: user.dob ?? null,
        role: user.role,
      },
    })

    return this.toDomain(created)
  }

  async updatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (!user) {
      return null
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { password },
    })

    return this.toDomain(updated)
  }

  async createPasswordReset(email: string, token: string): Promise<PasswordResetRequest> {
    const reset = await this.prisma.passwordReset.create({
      data: { email, token },
    })

    return this.resetToDomain(reset)
  }

  async findPasswordReset(token: string): Promise<PasswordResetRequest | null> {
    const reset = await this.prisma.passwordReset.findFirst({
      where: { token, used: false },
    })

    return reset ? this.resetToDomain(reset) : null
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.updateMany({
      where: { token },
      data: { used: true },
    })
  }
}
