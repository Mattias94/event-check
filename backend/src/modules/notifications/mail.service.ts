import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import * as QRCode from 'qrcode'
import { Event, User } from '../../common/domain.types'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null
  private readonly from = process.env.MAIL_FROM ?? 'Event Check <onboarding@resend.dev>'

  /**
   * Envia o e-mail de confirmação de inscrição com o QR code de check-in.
   * O QR contém o token assinado (JWT) que será lido no painel admin.
   * Retorna true se o envio foi realizado com sucesso.
   */
  async sendEnrollmentConfirmation(user: User, event: Event, qrToken: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY não configurada — e-mail de inscrição não enviado')
      return false
    }

    try {
      const qrPng = await QRCode.toBuffer(qrToken, {
        type: 'png',
        width: 320,
        errorCorrectionLevel: 'M',
        margin: 2,
      })

      const eventDate = new Date(`${event.date}T00:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: user.email,
        subject: `Inscrição confirmada: ${event.title}`,
        html: this.buildHtml(user, event, eventDate),
        attachments: [
          {
            filename: 'qrcode-checkin.png',
            content: qrPng.toString('base64'),
            contentType: 'image/png',
            contentId: 'qrcode-checkin',
          },
        ],
      })

      if (error) {
        this.logger.error(`Falha ao enviar e-mail para ${user.email}: ${error.message}`)
        return false
      }

      this.logger.log(`E-mail de inscrição enviado para ${user.email} (evento ${event.id})`)
      return true
    } catch (err) {
      this.logger.error(`Erro ao enviar e-mail de inscrição: ${(err as Error).message}`)
      return false
    }
  }

  private buildHtml(user: User, event: Event, eventDate: string): string {
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <div style="background: #4f46e5; border-radius: 12px 12px 0 0; padding: 24px 32px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Inscrição confirmada 🎉</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
          <p style="margin: 0 0 16px;">Olá, <strong>${user.name}</strong>!</p>
          <p style="margin: 0 0 24px;">
            Sua inscrição no evento abaixo foi confirmada com sucesso:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 96px;">Evento</td>
              <td style="padding: 8px 0;"><strong>${event.title}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Data</td>
              <td style="padding: 8px 0;">${eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Horário</td>
              <td style="padding: 8px 0;">${event.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Local</td>
              <td style="padding: 8px 0;">${event.location}</td>
            </tr>
          </table>

          <div style="text-align: center; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 24px;">
            <p style="margin: 0 0 16px; font-weight: bold;">Seu QR code de check-in</p>
            <img src="cid:qrcode-checkin" alt="QR code de check-in" width="240" height="240" style="display: block; margin: 0 auto;" />
            <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
              Apresente este QR code na entrada do evento para validar sua inscrição.
              Ele também está disponível no anexo deste e-mail.
            </p>
          </div>

          <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
            Este e-mail foi enviado automaticamente pelo Event Check. Se você não realizou esta inscrição, ignore esta mensagem.
          </p>
        </div>
      </div>
    `
  }
}
