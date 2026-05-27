'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { useWorkflow } from '@/hooks/useWorkflows'
import { useWorkflowRuns, useLiveWorkflowListEvents } from '@/hooks/useRuns'
import { formatDateTime, relativeTime } from '@/lib/utils'

export default function WorkflowRunsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: wf } = useWorkflow(id)
  const { data, isLoading } = useWorkflowRuns(id, 50)
  useLiveWorkflowListEvents(id)

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <header className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link
          href={`/workflows/${id}`}
          className="h-9 w-9 grid place-items-center rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[color:var(--muted)] mb-0.5">Runs</div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
            {wf?.name ?? 'Workflow'}
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--muted)] px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] animate-pulse" />
          {data?.total ?? 0} total · live
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {isLoading && (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        )}
        {data && data.items.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] grid place-items-center mb-4">
              <Activity className="h-5 w-5 text-[color:var(--muted)]" />
            </div>
            <h2 className="text-base font-medium">No runs yet</h2>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              Trigger a test run from the builder to see results here.
            </p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[color:var(--surface-2)] text-left text-[color:var(--muted)]">
                <tr>
                  <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Started</th>
                  <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Completed</th>
                  <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Entity</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3">{relativeTime(r.startedAt)}</td>
                    <td className="px-5 py-3 text-[color:var(--muted)]">
                      {r.completedAt ? formatDateTime(r.completedAt) : '—'}
                    </td>
                    <td className="px-5 py-3 text-[color:var(--muted)]">
                      {r.entityType ? `${r.entityType}:${r.entityId?.slice(-6) ?? '—'}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/workflows/${id}/runs/${r._id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-[color:var(--border-strong)] text-[color:var(--foreground)] transition-colors"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30',
    failed: 'bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/30',
    cancelled: 'bg-[color:var(--surface-3)] text-[color:var(--muted)] border-[color:var(--border)]',
    waiting: 'bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30',
    running: 'bg-[rgb(var(--tint)/0.1)] text-[color:var(--foreground)] border-[rgb(var(--tint)/0.2)]',
  }
  const cls = map[status] ?? map.running
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  )
}
