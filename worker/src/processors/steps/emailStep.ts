import nodemailer, { type Transporter } from 'nodemailer'
import type { AtomicStepHandler } from './types'
import { resolveVariables } from '../variableResolver'

let transporter: Transporter | null = null
function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

interface EmailConfig {
  to: string
  subject: string
  templateId?: string
  body?: string
}

export const emailStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<EmailConfig>
  if (!config.to || !config.subject) {
    return { kind: 'failed', error: 'send_email: missing to or subject after variable resolution' }
  }
  const from = process.env.SMTP_FROM || 'onboarding@resend.dev'
  try {
    const info = await getTransporter().sendMail({
      from,
      to: config.to,
      subject: config.subject,
      html: config.body || '',
    })
    return { kind: 'ok', output: { messageId: info.messageId, to: config.to } }
  } catch (e) {
    return { kind: 'failed', error: e instanceof Error ? e.message : String(e) }
  }
}
