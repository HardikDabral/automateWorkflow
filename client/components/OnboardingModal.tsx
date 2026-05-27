'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Plus, MessageSquare, MousePointer2, Zap, X } from 'lucide-react'

const STORAGE_KEY = 'wf_onboarding_seen_v1'

const STEPS = [
  {
    icon: Plus,
    title: 'Create a workflow',
    body: 'Hit "New workflow" on the dashboard and give it a name. You can rename it any time.',
  },
  {
    icon: MessageSquare,
    title: 'Describe it to the AI',
    body: 'Open the workflow and use the AI assistant on the right. "Email new leads after 3 days" is a good first prompt.',
  },
  {
    icon: MousePointer2,
    title: 'Tweak on the canvas',
    body: 'Click any step to edit its config. Add more steps from the palette in the top-left of the canvas.',
  },
  {
    icon: Zap,
    title: 'Test run',
    body: 'Save the workflow, then hit "Test run" to fire it once. Open the run page to watch each step execute live.',
  },
]

export function OnboardingModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const last = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[color:var(--surface-2)] to-[color:var(--surface)] border-b border-[color:var(--border)]">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[rgb(var(--tint)/0.05)] blur-3xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[rgb(var(--tint)/0.1)] grid place-items-center">
              <Sparkles className="h-5 w-5 text-[color:var(--foreground)]" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">
                Welcome
              </div>
              <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] grid place-items-center">
              <Icon className="h-5 w-5 text-[color:var(--foreground)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] mb-1">
                Step {step + 1} of {STEPS.length}
              </div>
              <h3 className="text-lg font-semibold">{current.title}</h3>
              <p className="text-sm text-[color:var(--muted)] mt-2 leading-relaxed">
                {current.body}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-white' : 'w-1.5 bg-[color:var(--border-strong)]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="h-9 px-3 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors"
                >
                  Back
                </button>
              )}
              {!last ? (
                <button
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="h-9 px-4 rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-fg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-fg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useOnboarding(): {
  open: boolean
  show: () => void
  close: () => void
} {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  function close() {
    setOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }

  return { open, show: () => setOpen(true), close }
}
