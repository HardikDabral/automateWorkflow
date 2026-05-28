'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Workflow as WorkflowIcon, CheckCircle2, Pause, FileEdit, HelpCircle } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api'
import { useWorkflowsList, useCreateWorkflow } from '@/hooks/useWorkflows'
import { relativeTime } from '@/lib/utils'
import { AppShell, PrimaryButton, GhostButton } from '@/components/AppShell'
import { OnboardingModal, useOnboarding } from '@/components/OnboardingModal'
import type { Workflow } from '@wf/shared'

export default function DashboardPage() {
  const router = useRouter()
  const { data: workflows, isLoading, error } = useWorkflowsList()
  const create = useCreateWorkflow()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const onboarding = useOnboarding()

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const wf = await create.mutateAsync({ name, description })
      router.push(`/workflows/${wf._id}`)
    } catch (e) {
      setErr(apiErrorMessage(e))
    }
  }

  const stats = computeStats(workflows ?? [])

  return (
    <AppShell
      subtitle="Automation"
      title="Welcome back"
      actions={
        <>
          <button
            onClick={onboarding.show}
            title="How it works"
            className="h-10 w-10 grid place-items-center rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <PrimaryButton onClick={() => setShowCreate(true)} className="px-3 sm:px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New workflow</span>
          </PrimaryButton>
        </>
      }
    >
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <HeroCard onNew={() => setShowCreate(true)} />
        <StatsCard stats={stats} />
      </section>

      <section id="workflows" className="mt-8 scroll-mt-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Your workflows</h2>
          <span className="text-xs text-[color:var(--muted)]">
            {workflows?.length ?? 0} total
          </span>
        </div>

        {isLoading && (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        )}
        {error && (
          <div className="text-sm text-[color:var(--danger)]">
            Failed to load: {apiErrorMessage(error)}
          </div>
        )}
        {workflows && workflows.length === 0 && (
          <EmptyState onCreate={() => setShowCreate(true)} />
        )}
        {workflows && workflows.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <WorkflowCard key={wf._id} wf={wf} />
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateDialog
          name={name}
          description={description}
          err={err}
          pending={create.isPending}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onCancel={() => setShowCreate(false)}
          onSubmit={onCreate}
        />
      )}

      <OnboardingModal open={onboarding.open} onClose={onboarding.close} />
    </AppShell>
  )
}

function HeroCard({ onNew }: { onNew: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--brand-rgb)/0.25)] bg-gradient-to-br from-[rgb(var(--brand-rgb)/0.08)] via-[color:var(--surface)] to-[color:var(--surface)] p-6 sm:p-8 shadow-[0_1px_0_rgb(var(--brand-rgb)/0.08),0_20px_60px_-30px_rgb(var(--brand-rgb)/0.5)]">
      <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[rgb(var(--brand-rgb)/0.18)] blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[rgb(var(--brand-rgb)/0.08)] blur-3xl" />
      <div className="relative">
        <div className="h-11 w-11 rounded-xl bg-[rgb(var(--brand-rgb)/0.15)] border border-[rgb(var(--brand-rgb)/0.25)] grid place-items-center mb-5">
          <WorkflowIcon className="h-5 w-5 text-[color:var(--brand)]" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Design automations visually</h3>
        <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md">
          Describe what should happen — the AI drafts it on the canvas. Edit the nodes,
          hit activate, and your workflow runs on every matching event.
        </p>
        <div className="mt-6">
          <PrimaryButton onClick={onNew}>
            <Plus className="h-4 w-4" /> Start from scratch
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

interface StatsShape {
  active: number
  paused: number
  draft: number
  total: number
}

function computeStats(workflows: Workflow[]): StatsShape {
  return {
    active: workflows.filter((w) => w.status === 'active').length,
    paused: workflows.filter((w) => w.status === 'paused').length,
    draft: workflows.filter((w) => w.status === 'draft').length,
    total: workflows.length,
  }
}

function StatsCard({ stats }: { stats: StatsShape }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--brand-rgb)/0.25)] bg-gradient-to-br from-[rgb(var(--brand-rgb)/0.08)] via-[color:var(--surface)] to-[color:var(--surface)] p-6 shadow-[0_1px_0_rgb(var(--brand-rgb)/0.08),0_20px_60px_-30px_rgb(var(--brand-rgb)/0.5)]">
      <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[rgb(var(--brand-rgb)/0.18)] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[rgb(var(--brand-rgb)/0.08)] blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">At a glance</h3>
          <span className="text-xs text-[color:var(--muted)]">this tenant</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />}
            label="Active"
            value={stats.active}
          />
          <StatTile
            icon={<Pause className="h-4 w-4 text-[color:var(--warning)]" />}
            label="Paused"
            value={stats.paused}
          />
          <StatTile
            icon={<FileEdit className="h-4 w-4 text-[color:var(--muted)]" />}
            label="Drafts"
            value={stats.draft}
          />
        </div>
      </div>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
      <div className="flex items-center gap-2 text-[color:var(--muted)] text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}

function WorkflowCard({ wf }: { wf: Workflow }) {
  return (
    <Link
      href={`/workflows/${wf._id}`}
      className="group relative block rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-10 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] grid place-items-center group-hover:bg-[color:var(--surface-3)]">
          <WorkflowIcon className="h-4 w-4 text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]" />
        </div>
        <StatusPill status={wf.status} />
      </div>
      <h3 className="mt-4 font-medium truncate">{wf.name}</h3>
      {wf.description ? (
        <p className="mt-1 text-sm text-[color:var(--muted)] line-clamp-2">
          {wf.description}
        </p>
      ) : (
        <p className="mt-1 text-sm text-[color:var(--muted-2)] italic">no description</p>
      )}
      <div className="mt-5 pt-4 border-t border-[color:var(--border)] text-xs text-[color:var(--muted)]">
        Updated {relativeTime(wf.updatedAt)}
      </div>
    </Link>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30',
    paused: 'bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30',
    draft: 'bg-[color:var(--surface-3)] text-[color:var(--muted)] border-[color:var(--border)]',
    archived: 'bg-[color:var(--surface-3)] text-[color:var(--muted)] border-[color:var(--border)]',
  }
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] ?? map.draft}`}
    >
      {status}
    </span>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] grid place-items-center mb-4">
        <WorkflowIcon className="h-5 w-5 text-[color:var(--muted)]" />
      </div>
      <h2 className="text-base font-medium">No workflows yet</h2>
      <p className="text-sm text-[color:var(--muted)] mt-1">
        Describe an automation to the AI or start from scratch.
      </p>
      <div className="mt-5 inline-flex">
        <PrimaryButton onClick={onCreate}>
          <Plus className="h-4 w-4" /> Create your first workflow
        </PrimaryButton>
      </div>
    </div>
  )
}

function CreateDialog({
  name,
  description,
  err,
  pending,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: {
  name: string
  description: string
  err: string | null
  pending: boolean
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold">New workflow</h2>
          <p className="text-xs text-[color:var(--muted)] mt-0.5">
            You can rename or change this later.
          </p>
        </div>
        <label className="block">
          <span className="text-xs text-[color:var(--muted)]">Name</span>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            maxLength={200}
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[color:var(--muted)]">Description</span>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2.5 outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]"
          />
        </label>
        {err && <div className="text-xs text-[color:var(--danger)]">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onCancel}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
