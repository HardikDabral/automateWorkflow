import axios from 'axios'
import nodemailer, { type Transporter } from 'nodemailer'
import type { AtomicStepHandler } from './types'
import { resolveVariables } from '../variableResolver'

interface EmailConfig {
  to: string
  subject: string
  templateId?: string
  body?: string
}

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

async function sendViaResend(config: EmailConfig, from: string): Promise<string> {
  const { data } = await axios.post(
    'https://api.resend.com/emails',
    {
      from,
      to: config.to,
      subject: config.subject,
      html: config.body || '',
    },
    {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      timeout: 10_000,
    },
  )
  return data.id
}

async function sendViaBrevo(config: EmailConfig, from: string): Promise<string> {
  const senderEmail = from.match(/<(.+)>/)?.[1] ?? from
  const senderName = from.match(/^(.+?)\s*</)?.[1]?.trim()
  const { data } = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: senderName ? { email: senderEmail, name: senderName } : { email: senderEmail },
      to: [{ email: config.to }],
      subject: config.subject,
      htmlContent: config.body || ' ',
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      timeout: 10_000,
    },
  )
  return data.messageId
}

async function sendViaSmtp(config: EmailConfig, from: string): Promise<string> {
  const info = await getTransporter().sendMail({
    from,
    to: config.to,
    subject: config.subject,
    html: config.body || '',
  })
  return info.messageId
}

export const emailStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<EmailConfig>
  if (!config.to || !config.subject) {
    return { kind: 'failed', error: 'send_email: missing to or subject after variable resolution' }
  }
  const from = process.env.SMTP_FROM || 'onboarding@resend.dev'
  let provider: 'brevo' | 'resend' | 'smtp' = 'smtp'
  try {
    let messageId: string
    if (process.env.BREVO_API_KEY) {
      provider = 'brevo'
      messageId = await sendViaBrevo(config as EmailConfig, from)
    } else if (process.env.RESEND_API_KEY) {
      provider = 'resend'
      messageId = await sendViaResend(config as EmailConfig, from)
    } else {
      messageId = await sendViaSmtp(config as EmailConfig, from)
    }
    return { kind: 'ok', output: { messageId, to: config.to, provider } }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return { kind: 'failed', error: `${provider}: ${JSON.stringify(e.response.data)}` }
    }
    return { kind: 'failed', error: e instanceof Error ? e.message : String(e) }
  }
}
