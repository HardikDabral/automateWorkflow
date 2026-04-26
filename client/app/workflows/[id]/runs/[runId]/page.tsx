'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, XCircle } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api'
import { useRun, useLiveRunEvents, useCancelRun } from '@/hooks/useRuns'
import { formatDateTime, relativeTime } from '@/lib/utils'

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>
}) {
  const { id, runId } = use(params)
  const { data, isLoading, error } = useRun(runId)
  useLiveRunEvents(runId)
  const cancel = useCancelRun()

  async function onCancel() {
    try {
      await cancel.mutateAsync(runId)
    } catch (e) {
      alert(apiErrorMessage(e))
    }
  }

  const canCancel = data?.run.status === 'running' || data?.run.status === 'waiting'

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <header className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link
          href={`/workflows/${id}/runs`}
          className="h-9 w-9 grid place-items-center rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[color:var(--muted)] mb-0.5">Run detail</div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
            Run {runId.slice(-8)}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {data?.run && <StatusBadge status={data.run.status} />}
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={cancel.isPending}
              title="Cancel run"
              className="h-10 px-3 sm:px-4 rounded-xl bg-[color:var(--danger)]/15 border border-[color:var(--danger)]/30 text-[color:var(--danger)] text-sm font-medium hover:bg-[color:var(--danger)]/25 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel run</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6">
        {isLoading && <div className="text-sm text-[color:var(--muted)]">Loading…</div>}
        {error && (
          <div className="text-sm text-[color:var(--danger)] px-4 py-3 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10">
            {apiErrorMessage(error)}
          </div>
        )}

        {data?.run && (
          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold">Run summary</h2>
              <Link
                href={`/workflows/${id}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-[color:var(--border-strong)] transition-colors"
              >
                Open builder →
              </Link>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Row label="Started" value={formatDateTime(data.run.startedAt)} />
              <Row label="Completed" value={formatDateTime(data.run.completedAt)} />
              <Row label="Resume at" value={formatDateTime(data.run.resumeAt)} />
              <Row
                label="Entity"
                value={
                  data.run.entityType
                    ? `${data.run.entityType}:${data.run.entityId?.slice(-6) ?? ''}`
                    : '—'
                }
              />
              <Row
                label="Error"
                value={data.run.errorMessage ?? '—'}
                danger={!!data.run.errorMessage}
                wide
              />
            </dl>
            {data.run.triggerPayload && (
              <details className="mt-5">
                <summary className="text-xs text-[color:var(--muted)] cursor-pointer hover:text-white transition-colors">
                  Trigger payload
                </summary>
                <pre className="mt-3 text-xs bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl p-4 overflow-auto">
                  {JSON.stringify(data.run.triggerPayload, null, 2)}
                </pre>
              </details>
            )}
          </section>
        )}

        {data?.steps && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Timeline</h2>
              <span className="text-xs text-[color:var(--muted)]">
                {data.steps.length} step{data.steps.length === 1 ? '' : 's'}
              </span>
            </div>
            <ol className="space-y-3">
              {data.steps.length === 0 && (
                <li className="text-sm text-[color:var(--muted)] text-center py-8 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)]">
                  No steps recorded yet.
                </li>
              )}
              {data.steps.map((s) => (
                <li
                  key={s._id}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {s.stepType}{' '}
                        <span className="text-xs text-[color:var(--muted-2)]">({s.stepId})</span>
                      </div>
                      <div className="text-xs text-[color:var(--muted)] mt-1">
                        {s.startedAt ? relativeTime(s.startedAt) : '—'}
                        {s.branchTaken && (
                          <>
                            {' · branch: '}
                            <strong className="text-white">{s.branchTaken}</strong>
                          </>
                        )}
                      </div>
                    </div>
                    <StepStatus status={s.status} />
                  </div>
                  {s.errorMessage && (
                    <div className="mt-3 text-xs text-[color:var(--danger)] px-3 py-2 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10">
                      {s.errorMessage}
                    </div>
                  )}
                  {(s.inputSnapshot || s.outputSnapshot) && (
                    <details className="mt-3">
                      <summary className="text-xs text-[color:var(--muted)] cursor-pointer hover:text-white transition-colors">
                        Input / output
                      </summary>
                      <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                        {s.inputSnapshot && (
                          <pre className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl p-3 overflow-auto">
                            <strong className="block text-[color:var(--muted)] mb-1.5">input</strong>
                            {JSON.stringify(s.inputSnapshot, null, 2)}
                          </pre>
                        )}
                        {s.outputSnapshot && (
                          <pre className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl p-3 overflow-auto">
                            <strong className="block text-[color:var(--muted)] mb-1.5">output</strong>
                            {JSON.stringify(s.outputSnapshot, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  )
}

function Row({
  label,
  value,
  danger,
  wide,
}: {
  label: string
  value: string
  danger?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)] mb-1">
        {label}
      </dt>
      <dd className={`text-sm ${danger ? 'text-[color:var(--danger)]' : ''}`}>{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30',
    failed: 'bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/30',
    cancelled: 'bg-[color:var(--surface-3)] text-[color:var(--muted)] border-[color:var(--border)]',
    waiting: 'bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30',
    running: 'bg-white/10 text-white border-white/20',
  }
  const cls = map[status] ?? map.running
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${cls}`}>
      {status}
    </span>
  )
}

function StepStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30',
    failed: 'bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/30',
    running: 'bg-white/10 text-white border-white/20',
    skipped: 'bg-[color:var(--surface-3)] text-[color:var(--muted)] border-[color:var(--border)]',
    waiting: 'bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30',
  }
  const cls = map[status] ?? map.waiting
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  )
}
