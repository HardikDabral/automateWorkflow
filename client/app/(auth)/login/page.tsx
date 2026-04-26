import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
      <div className="text-xs text-[color:var(--muted)] mb-1">Welcome back</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Sign in</h1>
      <div className="space-y-4">
        <div className="h-16 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] animate-pulse" />
        <div className="h-16 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] animate-pulse" />
        <div className="h-11 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] animate-pulse" />
      </div>
    </div>
  )
}
