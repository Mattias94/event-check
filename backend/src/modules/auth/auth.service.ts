import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { UsersRepository } from '../users/users.repository'
import { CreateUserDto } from '../users/dtos/create-user.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { LoginDto } from './dtos/login.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  login(dto: LoginDto) {
    const user = this.usersRepository.findByEmail(dto.email)
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const { password, ...safeUser } = user
    return safeUser
  }

  register(dto: CreateUserDto) {
    const existingUser = this.usersRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ConflictException('Este e-mail já está registrado')
    }

    const isFirstUser = this.usersRepository.findAll().length === 0
    const role = isFirstUser ? 'admin' : 'user'

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      dob: dto.dob,
      role,
    })

    const { password, ...safeUser } = user
    return { user: safeUser, isFirstUser }
  }

  forgotPassword(dto: ForgotPasswordDto) {
    const user = this.usersRepository.findByEmail(dto.email)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    this.usersRepository.createPasswordReset(dto.email, token)

    return {
      message: 'Solicitação de redefinição criada',
      token,
      resetUrl: `http://localhost:3000/reset-password?token=${token}`,
    }
  }

  resetPassword(dto: ResetPasswordDto) {
    const reset = this.usersRepository.findPasswordReset(dto.token)
    if (!reset) {
      throw new BadRequestException('Token inválido ou expirado')
    }

    this.usersRepository.updatePassword(reset.email, dto.newPassword)
    this.usersRepository.markPasswordResetUsed(dto.token)

    return { message: 'Senha atualizada com sucesso' }
  }
}
