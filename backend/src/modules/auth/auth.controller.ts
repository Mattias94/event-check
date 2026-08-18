import { Body, Controller, Get, Post, Query } from '@nestjs/common'
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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto)
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token)
  }

  @Get('verify-email')
  verifyEmailQuery(@Query('token') token: string) {
    return this.authService.verifyEmail(token)
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email)
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto)
  }
}
