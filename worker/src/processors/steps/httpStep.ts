import axios, { type AxiosRequestConfig } from 'axios'
import type { AtomicStepHandler } from './types'
import { resolveVariables } from '../variableResolver'

interface HttpConfig {
  method?: string
  url: string
  headers?: Record<string, string>
  body?: unknown
}

export const httpStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<HttpConfig>
  if (!config.url) return { kind: 'failed', error: 'http: missing url' }

  const request: AxiosRequestConfig = {
    method: (config.method || 'GET').toUpperCase(),
    url: config.url,
    headers: config.headers,
    data: config.body,
    timeout: 30_000,
    validateStatus: () => true, // we report non-2xx as output, not exception
  }
  try {
    const res = await axios.request(request)
    const ok = res.status >= 200 && res.status < 300
    return {
      kind: ok ? 'ok' : 'failed',
      output: { status: res.status, data: res.data },
      error: ok ? undefined : `http: status ${res.status}`,
    }
  } catch (e) {
    return { kind: 'failed', error: e instanceof Error ? e.message : String(e) }
  }
}
