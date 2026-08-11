import { Injectable } from '@nestjs/common'
import { InMemoryStore } from '../../common/in-memory-store'
import { PasswordResetRequest, User } from '../../common/domain.types'

@Injectable()
export class UsersRepository {
  constructor(private readonly store: InMemoryStore) {}

  findAll(): User[] {
    return [...this.store.users]
  }

  findById(id: string): User | null {
    return this.store.users.find((user) => user.id === id) ?? null
  }

  findByEmail(email: string): User | null {
    return this.store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null
  }

  create(user: Omit<User, 'id'>): User {
    const created: User = {
      ...user,
      id: Date.now().toString(),
    }

    this.store.users.push(created)
    return created
  }

  updatePassword(email: string, password: string): User | null {
    const user = this.findByEmail(email)
    if (!user) {
      return null
    }

    user.password = password
    return user
  }

  createPasswordReset(email: string, token: string): PasswordResetRequest {
    const reset: PasswordResetRequest = {
      email,
      token,
      createdAt: new Date().toISOString(),
      used: false,
    }

    this.store.passwordResets.push(reset)
    return reset
  }

  findPasswordReset(token: string): PasswordResetRequest | null {
    return this.store.passwordResets.find((reset) => reset.token === token && !reset.used) ?? null
  }

  markPasswordResetUsed(token: string): void {
    const reset = this.store.passwordResets.find((item) => item.token === token)
    if (reset) {
      reset.used = true
    }
  }
}
