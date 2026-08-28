export interface EmailAttachment {
  filename: string
  content: string
  contentType: string
  contentId?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<{ ok: boolean; error?: string; messageId?: string }>
  readonly name: string
}

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console'

  async send(options: SendEmailOptions) {
    console.log('\n========== E-MAIL (modo desenvolvimento) ==========')
    console.log(`Para: ${options.to}`)
    console.log(`Assunto: ${options.subject}`)
    console.log('Conteúdo HTML enviado (links estão no HTML abaixo)')
    console.log(options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    console.log('=================================================\n')
    return { ok: true }
  }
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend'

  constructor(
    private readonly client: import('resend').Resend,
    private readonly from: string,
  ) {}

  async send(options: SendEmailOptions) {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        contentId: attachment.contentId,
      })),
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }
}

/** Brevo (ex-Sendinblue) — API transacional v3. */
export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo'

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
  ) {}

  async send(options: SendEmailOptions) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
          attachment: options.attachments?.map((attachment) => ({
            name: attachment.filename,
            content: attachment.content,
          })),
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        return { ok: false, error: `Brevo HTTP ${response.status}: ${body}` }
      }

      const result = (await response.json()) as { messageId?: string }
      if (result.messageId) {
        console.log(`[Brevo] messageId=${result.messageId} → ${options.to}`)
      }

      return { ok: true, messageId: result.messageId }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erro ao contatar Brevo' }
    }
  }
}

/** Mailchimp Transactional (antigo Mandrill). */
export class MandrillEmailProvider implements EmailProvider {
  readonly name = 'mandrill'

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
  ) {}

  async send(options: SendEmailOptions) {
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: this.apiKey,
        message: {
          from_email: this.fromEmail,
          from_name: this.fromName,
          to: [{ email: options.to, type: 'to' }],
          subject: options.subject,
          html: options.html,
          attachments: options.attachments?.map((attachment) => ({
            type: attachment.contentType,
            name: attachment.filename,
            content: attachment.content,
          })),
          inline_css: true,
        },
      }),
    })

    if (!response.ok) {
      return { ok: false, error: `Mandrill HTTP ${response.status}` }
    }

    const body = (await response.json()) as Array<{ status: string; reject_reason?: string }>
    const rejected = body.find((item) => item.status === 'rejected' || item.status === 'invalid')
    if (rejected) {
      return { ok: false, error: rejected.reject_reason ?? 'E-mail rejeitado pelo Mandrill' }
    }

    return { ok: true }
  }
}
