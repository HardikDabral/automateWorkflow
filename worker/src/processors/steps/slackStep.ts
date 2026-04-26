import axios from 'axios'
import type { AtomicStepHandler } from './types'
import { resolveVariables } from '../variableResolver'

interface SlackConfig {
  channel: string
  message: string
}

export const slackStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<SlackConfig>
  if (!config.channel || !config.message) {
    return { kind: 'failed', error: 'slack: missing channel or message after variable resolution' }
  }
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    return { kind: 'failed', error: 'slack: SLACK_BOT_TOKEN not configured' }
  }
  try {
    const res = await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: config.channel, text: config.message },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    )
    if (!res.data?.ok) {
      return { kind: 'failed', error: `slack: ${res.data?.error || 'unknown error'}` }
    }
    return { kind: 'ok', output: { ts: res.data.ts, channel: res.data.channel } }
  } catch (e) {
    return { kind: 'failed', error: e instanceof Error ? e.message : String(e) }
  }
}
