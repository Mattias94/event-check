import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import * as QRCode from 'qrcode'
import { Event, User } from '../../common/domain.types'
import {
  ConsoleEmailProvider,
  EmailProvider,
  MandrillEmailProvider,
  ResendEmailProvider,
} from './email-provider'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly provider: EmailProvider
  private readonly frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'

  constructor() {
    this.provider = this.createProvider()
    this.logger.log(`Provedor de e-mail ativo: ${this.provider.name}`)
  }

  isConfigured(): boolean {
    return this.provider.name !== 'console'
  }

  private createProvider(): EmailProvider {
    const provider = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase()
    const from = process.env.MAIL_FROM ?? 'Event Check <onboarding@resend.dev>'
    const allowConsole = process.env.EMAIL_DEV_CONSOLE !== 'false'

    if (provider === 'mandrill' || provider === 'mailchimp') {
      const apiKey = process.env.MANDRILL_API_KEY ?? process.env.MAILCHIMP_TRANSACTIONAL_KEY
      if (!apiKey) {
        this.logger.warn('MANDRILL_API_KEY não configurada')
        return allowConsole ? new ConsoleEmailProvider() : this.unconfiguredProvider()
      }

      const fromMatch = from.match(/^(.*?)<([^>]+)>$/)
      const fromName = fromMatch?.[1]?.trim() || 'Event Check'
      const fromEmail = fromMatch?.[2]?.trim() || from
      return new MandrillEmailProvider(apiKey, fromEmail, fromName)
    }

    if (process.env.RESEND_API_KEY) {
      return new ResendEmailProvider(new Resend(process.env.RESEND_API_KEY), from)
    }

    this.logger.warn('RESEND_API_KEY não configurada')
    if (allowConsole) {
      this.logger.warn('Usando ConsoleEmailProvider — links aparecerão no terminal do backend')
      return new ConsoleEmailProvider()
    }

    return this.unconfiguredProvider()
  }

  private unconfiguredProvider(): EmailProvider {
    return {
      name: 'none',
      send: async () => ({ ok: false, error: 'Provedor de e-mail não configurado' }),
    }
  }

  async sendEmailVerification(user: User, token: string): Promise<boolean> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`

    return this.send({
      to: user.email,
      subject: 'Confirme seu e-mail — Event Check',
      html: this.wrapHtml(
        'Confirme seu e-mail',
        `
          <p>Olá, <strong>${user.name}</strong>!</p>
          <p>Obrigado por se cadastrar no Event Check. Clique no botão abaixo para confirmar seu e-mail e ativar sua conta:</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
              Confirmar e-mail
            </a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">
            Ou copie este link no navegador:<br />
            <a href="${verifyUrl}" style="color: #4f46e5; word-break: break-all;">${verifyUrl}</a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">Este link expira em 24 horas.</p>
        `,
      ),
      logContext: `verificação para ${user.email}`,
      devUrl: verifyUrl,
    })
  }

  async sendPasswordReset(user: User, token: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`

    return this.send({
      to: user.email,
      subject: 'Recuperação de senha — Event Check',
      html: this.wrapHtml(
        'Recuperar senha',
        `
          <p>Olá, <strong>${user.name}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
              Redefinir senha
            </a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">
            Ou copie este link no navegador:<br />
            <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        `,
      ),
      logContext: `recuperação de senha para ${user.email}`,
      devUrl: resetUrl,
    })
  }

  async sendEnrollmentConfirmation(user: User, event: Event, qrToken: string): Promise<boolean> {
    try {
      const qrPng = await QRCode.toBuffer(qrToken, {
        type: 'png',
        width: 320,
        errorCorrectionLevel: 'M',
        margin: 2,
      })

      const eventDate = this.formatEventDate(event.date)

      return this.send({
        to: user.email,
        subject: `Inscrição confirmada: ${event.title}`,
        html: this.buildEnrollmentHtml(user, event, eventDate),
        attachments: [
          {
            filename: 'qrcode-checkin.png',
            content: qrPng.toString('base64'),
            contentType: 'image/png',
            contentId: 'qrcode-checkin',
          },
        ],
        logContext: `inscrição ${event.id} para ${user.email}`,
      })
    } catch (err) {
      this.logger.error(`Erro ao gerar QR code: ${(err as Error).message}`)
      return false
    }
  }

  async sendEventCancellation(user: User, event: Event): Promise<boolean> {
    const eventDate = this.formatEventDate(event.date)

    return this.send({
      to: user.email,
      subject: `Evento cancelado: ${event.title}`,
      html: this.wrapHtml(
        'Evento cancelado',
        `
          <p>Olá, <strong>${user.name}</strong>,</p>
          <p>Informamos que o evento abaixo foi <strong>cancelado</strong> pelo organizador:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 96px;">Evento</td><td><strong>${event.title}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Data</td><td>${eventDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Horário</td><td>${event.time}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Local</td><td>${event.location}</td></tr>
          </table>
          <p>Sua inscrição permanece registrada, mas o evento não ocorrerá. Nenhuma ação adicional é necessária.</p>
        `,
      ),
      logContext: `cancelamento ${event.id} para ${user.email}`,
    })
  }

  private async send(options: {
    to: string
    subject: string
    html: string
    attachments?: { filename: string; content: string; contentType: string; contentId?: string }[]
    logContext: string
    devUrl?: string
  }): Promise<boolean> {
    if (options.devUrl && this.provider.name === 'console') {
      this.logger.warn(`[DEV] Link (${options.logContext}): ${options.devUrl}`)
    }

    const result = await this.provider.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })

    if (!result.ok) {
      this.logger.error(`Falha ao enviar e-mail (${options.logContext}): ${result.error}`)
      if (options.devUrl) {
        this.logger.warn(`[FALLBACK] Use este link manualmente: ${options.devUrl}`)
      }
      return false
    }

    this.logger.log(`E-mail enviado (${options.logContext})`)
    return true
  }

  private formatEventDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  private wrapHtml(title: string, body: string): string {
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <div style="background: #4f46e5; border-radius: 12px 12px 0 0; padding: 24px 32px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">${title}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
          ${body}
          <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
            Este e-mail foi enviado automaticamente pelo Event Check.
          </p>
        </div>
      </div>
    `
  }

  private buildEnrollmentHtml(user: User, event: Event, eventDate: string): string {
    return this.wrapHtml(
      'Inscrição confirmada 🎉',
      `
        <p>Olá, <strong>${user.name}</strong>!</p>
        <p>Sua inscrição no evento abaixo foi confirmada com sucesso:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 96px;">Evento</td><td><strong>${event.title}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Data</td><td>${eventDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Horário</td><td>${event.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Local</td><td>${event.location}</td></tr>
        </table>
        <div style="text-align: center; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 24px;">
          <p style="margin: 0 0 16px; font-weight: bold;">Seu QR code de check-in</p>
          <img src="cid:qrcode-checkin" alt="QR code de check-in" width="240" height="240" style="display: block; margin: 0 auto;" />
          <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
            Apresente este QR code na entrada do evento. Ele também está no anexo deste e-mail.
          </p>
        </div>
      `,
    )
  }
}
