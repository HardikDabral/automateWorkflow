'use client'

import type { AuthResponse } from '@wf/shared'

const STORAGE_KEY = 'wf.auth'
const COOKIE_KEY = 'wf_auth'

export type StoredAuth = AuthResponse

export function saveAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  // Non-HttpOnly flag cookie so the Next 16 proxy can gate routes.
  // The real token lives in localStorage; this cookie carries no secret.
  document.cookie = `${COOKIE_KEY}=1; path=/; SameSite=Lax`
}

export function loadAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  document.cookie = `${COOKIE_KEY}=; path=/; Max-Age=0`
}

export function getToken(): string | null {
  return loadAuth()?.token ?? null
}
