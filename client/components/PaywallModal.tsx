'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X, Github, Mail } from 'lucide-react'
import { onQuotaExceeded } from '@/lib/api'

export function PaywallModal() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => onQuotaExceeded((m) => setMessage(m)), [])

  if (!message) return null

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="relative p-6 bg-gradient-to-br from-[color:var(--surface-2)] to-[color:var(--surface)] border-b border-[color:var(--border)]">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
          <button
            onClick={() => setMessage(null)}
            className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center mb-4">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
              Free trial used up
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Upgrade to keep building</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[color:var(--muted)] leading-relaxed">{message}</p>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed">
            This is a portfolio demo by Hardik Dabral. The free trial covers a few AI prompts and
            test runs so the LLM bill stays sane. Reach out if you want to keep poking around.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href="https://github.com/hardikdabral2003"
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-3)] transition-colors flex items-center justify-center gap-2"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a
              href="mailto:personalregisterkaro@gmail.com"
              className="h-10 px-4 rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-fg)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" /> Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
