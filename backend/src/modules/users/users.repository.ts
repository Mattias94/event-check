import { Injectable } from '@nestjs/common'
import { PasswordResetRequest, User, EmailVerificationRequest } from '../../common/domain.types'
import { PrismaService } from '../../common/prisma.service'
import type { UserModel as PrismaUser, PasswordResetModel as PrismaPasswordReset, EmailVerificationModel as PrismaEmailVerification } from '../../generated/prisma/models'

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
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      emailVerified: user.emailVerified,
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

  private verificationToDomain(verification: PrismaEmailVerification): EmailVerificationRequest {
    return {
      email: verification.email,
      token: verification.token,
      createdAt: verification.createdAt.toISOString(),
      expiresAt: verification.expiresAt.toISOString(),
      used: verification.used,
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
        phone: user.phone ?? null,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })

    return this.toDomain(created)
  }

  async markEmailVerified(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (!user) {
      return null
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })

    return this.toDomain(updated)
  }

  async createEmailVerification(email: string, token: string, expiresAt: Date): Promise<EmailVerificationRequest> {
    await this.prisma.emailVerification.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    const verification = await this.prisma.emailVerification.create({
      data: { email, token, expiresAt },
    })

    return this.verificationToDomain(verification)
  }

  async findEmailVerification(token: string): Promise<EmailVerificationRequest | null> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: { token, used: false },
    })

    return verification ? this.verificationToDomain(verification) : null
  }

  async markEmailVerificationUsed(token: string): Promise<void> {
    await this.prisma.emailVerification.updateMany({
      where: { token },
      data: { used: true },
    })
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

  async updateProfile(
    id: string,
    data: { name?: string; phone?: string | null; avatarUrl?: string | null },
  ): Promise<User | null> {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return null
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    })

    return this.toDomain(updated)
  }
}
