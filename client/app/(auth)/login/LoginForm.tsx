'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { AuthResponse } from '@wf/shared'
import { api, apiErrorMessage } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
      saveAuth(data)
      const next = params.get('next') || '/dashboard'
      router.push(next)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
      <div className="text-xs text-[color:var(--muted)] mb-1">Welcome back</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-[color:var(--muted)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[color:var(--muted)]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={1}
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
        </label>
        {error && (
          <div className="text-xs text-[color:var(--danger)] px-3 py-2 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-fg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Need an account?{' '}
        <Link href="/signup" className="text-white hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
