import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { clearAuthCookie, setAuthCookie } from '../../common/auth-cookie'
import { CreateUserDto } from '../users/dtos/create-user.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { LoginDto } from './dtos/login.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'
import { VerifyEmailDto } from './dtos/verify-email.dto'
import { ResendVerificationDto } from './dtos/resend-verification.dto'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto)
    setAuthCookie(res, result.token)
    return result
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res)
    return { message: 'Logout realizado com sucesso' }
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto)
    if (result.token) {
      setAuthCookie(res, result.token)
    }
    return result
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyEmail(dto.token)
    setAuthCookie(res, result.token)
    return result
  }

  @Get('verify-email')
  async verifyEmailQuery(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyEmail(token)
    setAuthCookie(res, result.token)
    return result
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto)
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email)
  }
}
