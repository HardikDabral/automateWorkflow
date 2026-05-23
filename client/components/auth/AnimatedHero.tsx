import { Sparkles } from 'lucide-react'

export function AnimatedHero() {
  return (
    <section className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[color:var(--surface-2)] via-[color:var(--surface)] to-[color:var(--surface)] border-r border-[color:var(--border)] relative overflow-hidden">
      {/* 3D rotating ring system — runs forever */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="scene-3d relative"
          style={{ width: 'min(70vh, 560px)', height: 'min(70vh, 560px)' }}
        >
          <div className="ring" style={{ animation: 'ring-a 20s linear infinite' }} />
          <div
            className="ring"
            style={{ animation: 'ring-b 16s linear infinite reverse', inset: '10%' }}
          />
          <div
            className="ring"
            style={{ animation: 'ring-c 24s linear infinite', inset: '22%' }}
          />
          <div
            className="ring"
            style={{ animation: 'ring-d 28s linear infinite reverse', inset: '36%' }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center mb-6">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
          Automation · new era
        </div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight max-w-md">
          Design workflows that{' '}
          <span className="text-[color:var(--muted)]">think</span> with you.
        </h2>
        <p className="mt-4 text-sm text-[color:var(--muted)] max-w-md">
          Describe automations in plain English — the AI drafts them on the canvas. You tweak,
          activate, and we run them on every matching event.
        </p>
      </div>

      <div className="relative z-10 text-xs text-[color:var(--muted-2)]">
        © {new Date().getFullYear()} Workflow Platform
      </div>
    </section>
  )
}
