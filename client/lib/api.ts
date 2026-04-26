'use client'

import axios, { AxiosError, type AxiosInstance } from 'axios'
import { clearAuth, getToken } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type QuotaListener = (message: string) => void
const quotaListeners = new Set<QuotaListener>()

export function onQuotaExceeded(listener: QuotaListener): () => void {
  quotaListeners.add(listener)
  return () => quotaListeners.delete(listener)
}

export function isQuotaError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 402
}

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
  })

  instance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        clearAuth()
        const path = window.location.pathname
        if (!path.startsWith('/login') && !path.startsWith('/signup')) {
          window.location.href = '/login'
        }
      }
      if (err.response?.status === 402) {
        const body = err.response.data as { error?: string } | undefined
        const message = body?.error || 'Free trial limit reached.'
        quotaListeners.forEach((fn) => fn(message))
      }
      return Promise.reject(err)
    },
  )

  return instance
}

export const api = createClient()

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: string; message?: string } | undefined
    return body?.error || body?.message || err.message
  }
  return err instanceof Error ? err.message : 'Request failed'
}
