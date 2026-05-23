'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, Zap, LogOut, RotateCcw, Mail, ShieldCheck, X } from 'lucide-react'
import { loadAuth, clearAuth } from '@/lib/auth'
import { disconnectSocket } from '@/lib/socket'
import { useUsage } from '@/hooks/useUsage'

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const auth = typeof window !== 'undefined' ? loadAuth() : null
  const { data: usage } = useUsage()

  if (!open) return null

  function onLogout() {
    clearAuth()
    disconnectSocket()
    onClose()
    router.push('/login')
  }

  function onResetOnboarding() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wf_onboarding_seen_v1')
    }
    onClose()
    router.refresh()
  }

  const aiLeft = usage ? Math.max(0, usage.aiCallLimit - usage.aiCallsUsed) : 0
  const runsLeft = usage ? Math.max(0, usage.testRunLimit - usage.testRunsUsed) : 0

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="relative px-6 py-5 border-b border-[color:var(--border)] bg-gradient-to-br from-[color:var(--surface-2)] to-[color:var(--surface)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">
            Account
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] mb-2">
              Profile
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-3">
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={auth?.user.email ?? '—'} />
              <Row
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Plan"
                value={usage?.plan ?? 'trial'}
              />
            </div>
          </div>

          {usage?.plan === 'trial' && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] mb-2">
                Trial usage
              </div>
              <div className="grid grid-cols-2 gap-3">
                <UsageTile
                  icon={<Sparkles className="h-4 w-4" />}
                  label="AI calls"
                  used={usage.aiCallsUsed}
                  limit={usage.aiCallLimit}
                  left={aiLeft}
                />
                <UsageTile
                  icon={<Zap className="h-4 w-4" />}
                  label="Test runs"
                  used={usage.testRunsUsed}
                  limit={usage.testRunLimit}
                  left={runsLeft}
                />
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] mb-2">
              Actions
            </div>
            <div className="space-y-2">
              <ActionRow
                icon={<RotateCcw className="h-4 w-4" />}
                label="Show tutorial again"
                hint="Replay the four-step intro on next dashboard load"
                onClick={onResetOnboarding}
              />
              <ActionRow
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                hint="End this session and return to login"
                onClick={onLogout}
                danger
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[color:var(--muted)]">{icon}</span>
      <span className="text-xs text-[color:var(--muted)] w-16">{label}</span>
      <span className="text-sm text-[color:var(--foreground)] truncate">{value}</span>
    </div>
  )
}

function UsageTile({
  icon,
  label,
  used,
  limit,
  left,
}: {
  icon: React.ReactNode
  label: string
  used: number
  limit: number
  left: number
}) {
  const pct = Math.min(100, (used / limit) * 100)
  const low = left <= 1
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
      <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl font-semibold">{used}</span>
        <span className="text-xs text-[color:var(--muted-2)]">/ {limit}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
        <div
          className={`h-full rounded-full ${low ? 'bg-[color:var(--warning)]' : 'bg-white/70'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ActionRow({
  icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)] p-3 text-left transition-colors ${
        danger ? 'hover:border-[color:var(--danger)]/40' : ''
      }`}
    >
      <span
        className={`h-9 w-9 grid place-items-center rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] ${
          danger ? 'text-[color:var(--danger)]' : 'text-[color:var(--muted)]'
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${danger ? 'text-[color:var(--danger)]' : ''}`}>
          {label}
        </div>
        <div className="text-[11px] text-[color:var(--muted-2)] truncate">{hint}</div>
      </div>
    </button>
  )
}
