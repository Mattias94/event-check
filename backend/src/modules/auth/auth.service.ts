import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { hashPassword, verifyPassword } from '../../common/password'
import { signSessionToken } from '../../common/session-token'
import { UsersRepository } from '../users/users.repository'
import { CreateUserDto } from '../users/dtos/create-user.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { LoginDto } from './dtos/login.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email)
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const { password, ...safeUser } = user
    const token = signSessionToken({ sub: user.id, role: user.role })
    return { ...safeUser, token }
  }

  async register(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ConflictException('Este e-mail já está registrado')
    }

    // O papel é decidido exclusivamente pelo servidor: o primeiro usuário
    // do sistema vira admin, todos os demais são usuários comuns.
    const isFirstUser = (await this.usersRepository.count()) === 0
    const role = isFirstUser ? 'admin' : 'user'

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: await hashPassword(dto.password),
      dob: dto.dob,
      role,
    })

    const { password, ...safeUser } = user
    const token = signSessionToken({ sub: user.id, role: user.role })
    return { user: safeUser, isFirstUser, token }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(dto.email)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await this.usersRepository.createPasswordReset(dto.email, token)

    return {
      message: 'Solicitação de redefinição criada',
      token,
      resetUrl: `http://localhost:3000/reset-password?token=${token}`,
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.usersRepository.findPasswordReset(dto.token)
    if (!reset) {
      throw new BadRequestException('Token inválido ou expirado')
    }

    await this.usersRepository.updatePassword(reset.email, await hashPassword(dto.newPassword))
    await this.usersRepository.markPasswordResetUsed(dto.token)

    return { message: 'Senha atualizada com sucesso' }
  }
}
