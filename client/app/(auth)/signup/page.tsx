'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AuthResponse } from '@wf/shared'
import { api, apiErrorMessage } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/signup', {
        companyName,
        email,
        password,
      })
      saveAuth(data)
      router.push('/dashboard')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
      <div className="text-xs text-[color:var(--muted)] mb-1">Get started</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Create an account</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">
        Your tenant is provisioned automatically.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-[color:var(--muted)]">Company name</span>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
        </label>
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
            minLength={8}
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
          <span className="block mt-1.5 text-xs text-[color:var(--muted-2)]">
            At least 8 characters.
          </span>
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
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[color:var(--foreground)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
