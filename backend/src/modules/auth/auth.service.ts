import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { hashPassword, verifyPassword } from '../../common/password'
import { signSessionToken } from '../../common/session-token'
import { MailService } from '../notifications/mail.service'
import { UsersRepository } from '../users/users.repository'
import { CreateUserDto } from '../users/dtos/create-user.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { LoginDto } from './dtos/login.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'

@Injectable()
export class AuthService {
  /** Desabilitar temporariamente: EMAIL_VERIFICATION_REQUIRED=false no .env */
  private readonly emailVerificationRequired =
    process.env.EMAIL_VERIFICATION_REQUIRED === 'true'

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email)
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('E-mail ou senha incorretos.')
    }

    if (this.emailVerificationRequired && !user.emailVerified) {
      throw new UnauthorizedException(
        'E-mail não verificado. Confira sua caixa de entrada e confirme seu cadastro.',
      )
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

    const isFirstUser = (await this.usersRepository.count()) === 0
    const role = isFirstUser ? 'admin' : 'user'

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: await hashPassword(dto.password),
      dob: dto.dob,
      role,
      emailVerified: this.emailVerificationRequired ? isFirstUser : true,
    })

    const { password, ...safeUser } = user
    let emailSent = false

    if (this.emailVerificationRequired && !isFirstUser) {
      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await this.usersRepository.createEmailVerification(user.email, token, expiresAt)
      emailSent = await this.mailService.sendEmailVerification(user, token)
    }

    const token = user.emailVerified || !this.emailVerificationRequired
      ? signSessionToken({ sub: user.id, role: user.role })
      : undefined

    return {
      user: safeUser,
      isFirstUser,
      emailSent,
      token,
      message: this.emailVerificationRequired
        ? isFirstUser
          ? 'Conta de administrador criada com sucesso.'
          : emailSent
            ? 'Conta criada! Enviamos um e-mail com o link de confirmação.'
            : 'Conta criada! Verifique seu e-mail para confirmar o cadastro (envio pendente de configuração).'
        : 'Conta criada com sucesso! Você já pode fazer login.',
    }
  }

  async verifyEmail(token: string) {
    if (!this.emailVerificationRequired) {
      throw new BadRequestException('Verificação por e-mail está temporariamente desabilitada')
    }
    const verification = await this.usersRepository.findEmailVerification(token)
    if (!verification) {
      throw new BadRequestException('Token inválido ou já utilizado')
    }

    if (new Date(verification.expiresAt) < new Date()) {
      throw new BadRequestException('Token expirado. Faça um novo cadastro ou solicite reenvio.')
    }

    const user = await this.usersRepository.markEmailVerified(verification.email)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    await this.usersRepository.markEmailVerificationUsed(token)

    const { password, ...safeUser } = user
    const sessionToken = signSessionToken({ sub: user.id, role: user.role })

    return {
      message: 'E-mail verificado com sucesso!',
      user: safeUser,
      token: sessionToken,
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(dto.email)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const token = randomUUID()
    await this.usersRepository.createPasswordReset(dto.email, token)

    const emailSent = await this.mailService.sendPasswordReset(user, token)
    if (!emailSent && this.mailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes.',
      )
    }

    return {
      message: emailSent
        ? 'Enviamos um link de recuperação para o seu e-mail.'
        : 'Link de recuperação gerado. Verifique o terminal do backend (modo desenvolvimento).',
      emailSent,
    }
  }

  async resendVerificationEmail(email: string) {
    if (!this.emailVerificationRequired) {
      throw new BadRequestException('Verificação por e-mail está temporariamente desabilitada')
    }
    const user = await this.usersRepository.findByEmail(email)
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (user.emailVerified) {
      throw new BadRequestException('Este e-mail já foi verificado')
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await this.usersRepository.createEmailVerification(user.email, token, expiresAt)

    const emailSent = await this.mailService.sendEmailVerification(user, token)
    if (!emailSent && this.mailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Não foi possível reenviar o e-mail de verificação. Tente novamente em instantes.',
      )
    }

    return {
      message: emailSent
        ? 'E-mail de verificação reenviado com sucesso.'
        : 'Link de verificação gerado. Verifique o terminal do backend (modo desenvolvimento).',
      emailSent,
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
