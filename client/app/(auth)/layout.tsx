import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[color:var(--background)] grid lg:grid-cols-[1fr_1.1fr]">
      <section className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[color:var(--surface-2)] via-[color:var(--surface)] to-[color:var(--surface)] border-r border-[color:var(--border)] relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center mb-6">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-2">
            Automation · new era
          </div>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight max-w-md">
            Design workflows that <span className="text-[color:var(--muted)]">think</span> with you.
          </h2>
          <p className="mt-4 text-sm text-[color:var(--muted)] max-w-md">
            Describe automations in plain English — the AI drafts them on the canvas.
            You tweak, activate, and we run them on every matching event.
          </p>
        </div>
        <div className="relative text-xs text-[color:var(--muted-2)]">
          © {new Date().getFullYear()} Workflow Platform
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  )
}
