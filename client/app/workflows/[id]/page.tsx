'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  ListOrdered,
  Zap,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { apiErrorMessage } from '@/lib/api'
import { useWorkflowStore } from '@/store/workflowStore'
import {
  useWorkflow,
  useCreateVersion,
  useActivatePreview,
  useActivateWorkflow,
  usePauseWorkflow,
  useTestRunWorkflow,
} from '@/hooks/useWorkflows'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { ConfigPanel } from '@/components/canvas/ConfigPanel'
import { AIChatPanel } from '@/components/ai-chat/AIChatPanel'
import { GhostButton, PrimaryButton } from '@/components/AppShell'

export default function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const { data: wf, isLoading } = useWorkflow(id)
  const definition = useWorkflowStore((s) => s.definition)
  const isDirty = useWorkflowStore((s) => s.isDirty)
  const setDefinition = useWorkflowStore((s) => s.setDefinition)
  const markSaved = useWorkflowStore((s) => s.markSaved)
  const reset = useWorkflowStore((s) => s.reset)

  const [aiSessionId, setAiSessionId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showActivate, setShowActivate] = useState(false)
  const [configCollapsed, setConfigCollapsed] = useState(false)
  const [aiCollapsed, setAiCollapsed] = useState(false)
  const [mobileTab, setMobileTab] = useState<'canvas' | 'config' | 'ai'>('canvas')

  const createVersion = useCreateVersion(id)
  const activate = useActivateWorkflow(id)
  const pause = usePauseWorkflow(id)
  const testRun = useTestRunWorkflow(id)

  useEffect(() => {
    if (!wf) return
    const activeDef = (wf.activeVersionId as unknown as { definition?: typeof definition })?.definition
    if (activeDef) {
      setDefinition(activeDef, false)
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wf?._id])

  async function onSave() {
    setErr(null)
    try {
      await createVersion.mutateAsync({
        definition,
        authoredVia: aiSessionId ? 'ai_chat' : 'visual_builder',
        aiSessionId: aiSessionId ?? undefined,
      })
      markSaved()
    } catch (e) {
      setErr(apiErrorMessage(e))
    }
  }

  async function onTestRun() {
    setErr(null)
    try {
      const run = await testRun.mutateAsync({})
      router.push(`/workflows/${id}/runs/${run._id}`)
    } catch (e) {
      setErr(apiErrorMessage(e))
    }
  }

  async function onPause() {
    setErr(null)
    try {
      await pause.mutateAsync()
    } catch (e) {
      setErr(apiErrorMessage(e))
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-[color:var(--muted)] bg-[color:var(--background)] min-h-screen">
        Loading…
      </div>
    )
  }
  if (!wf) {
    return (
      <div className="p-6 text-sm text-[color:var(--danger)] bg-[color:var(--background)] min-h-screen">
        Workflow not found.
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[color:var(--background)]">
      <header className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate">{wf.name}</h1>
              <StatusPill status={wf.status} />
              {isDirty && (
                <span className="hidden sm:inline text-[11px] text-[color:var(--warning)]">
                  • unsaved
                </span>
              )}
            </div>
            <div className="text-[11px] text-[color:var(--muted-2)]">Workflow builder</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/workflows/${id}/runs`}
            title="Runs"
            className="hidden sm:flex h-10 px-3 lg:px-4 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors items-center gap-2"
          >
            <ListOrdered className="h-4 w-4" />
            <span className="hidden lg:inline">Runs</span>
          </Link>
          <GhostButton
            onClick={onTestRun}
            disabled={testRun.isPending || isDirty}
            title={isDirty ? 'Save first' : 'Run this workflow once'}
            className="px-3 lg:px-4"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden lg:inline">
              {testRun.isPending ? 'Firing…' : 'Test run'}
            </span>
          </GhostButton>
          <GhostButton
            onClick={onSave}
            disabled={createVersion.isPending}
            title="Save"
            className="px-3 lg:px-4"
          >
            <Save className="h-4 w-4" />
            <span className="hidden lg:inline">
              {createVersion.isPending ? 'Saving…' : 'Save'}
            </span>
          </GhostButton>
          {wf.status === 'active' ? (
            <button
              onClick={onPause}
              disabled={pause.isPending}
              title="Pause"
              className="h-10 px-3 lg:px-4 rounded-xl bg-[color:var(--warning)]/15 border border-[color:var(--warning)]/30 text-[color:var(--warning)] text-sm font-medium hover:bg-[color:var(--warning)]/25 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              <span className="hidden lg:inline">Pause</span>
            </button>
          ) : (
            <PrimaryButton onClick={() => setShowActivate(true)} className="px-3 lg:px-4">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Activate</span>
            </PrimaryButton>
          )}
        </div>
      </header>

      {err && (
        <div className="px-5 py-2 text-xs text-[color:var(--danger)] bg-[color:var(--danger)]/10 border-b border-[color:var(--danger)]/30">
          {err}
        </div>
      )}

      <div className="flex-1 flex min-h-0 pb-14 lg:pb-0">
        <div
          className={`flex-1 min-w-0 ${
            mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
          }`}
        >
          <WorkflowCanvas />
        </div>
        <div
          className={`${
            mobileTab === 'config' ? 'flex-1 lg:flex-none' : 'hidden lg:block'
          }`}
        >
          <ConfigPanel
            collapsed={configCollapsed}
            onToggle={() => setConfigCollapsed((v) => !v)}
          />
        </div>
        <div
          className={`shrink-0 transition-[width] duration-200 ${
            mobileTab === 'ai' ? 'flex-1 lg:flex-none' : 'hidden lg:block'
          } ${aiCollapsed ? 'lg:w-12' : 'lg:w-[380px]'}`}
        >
          <AIChatPanel
            onSessionChange={setAiSessionId}
            collapsed={aiCollapsed}
            onToggle={() => setAiCollapsed((v) => !v)}
          />
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-3 bg-[color:var(--surface)] border-t border-[color:var(--border)]">
        <MobileTab
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Canvas"
          active={mobileTab === 'canvas'}
          onClick={() => setMobileTab('canvas')}
        />
        <MobileTab
          icon={<SlidersHorizontal className="h-4 w-4" />}
          label="Config"
          active={mobileTab === 'config'}
          onClick={() => setMobileTab('config')}
        />
        <MobileTab
          icon={<Sparkles className="h-4 w-4" />}
          label="AI"
          active={mobileTab === 'ai'}
          onClick={() => setMobileTab('ai')}
        />
      </nav>

      {showActivate && (
        <ActivateDialog
          workflowId={id}
          onCancel={() => setShowActivate(false)}
          onConfirm={async (activateFrom) => {
            try {
              await activate.mutateAsync({ activateFrom })
              setShowActivate(false)
            } catch (e) {
              setErr(apiErrorMessage(e))
            }
          }}
        />
      )}
    </div>
  )
}

function MobileTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 h-14 text-[11px] transition-colors ${
        active
          ? 'text-white bg-[color:var(--surface-2)]'
          : 'text-[color:var(--muted)] hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
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

function ActivateDialog({
  workflowId,
  onCancel,
  onConfirm,
}: {
  workflowId: string
  onCancel: () => void
  onConfirm: (from: 'future_only' | 'all') => Promise<void>
}) {
  const { data: preview, isLoading } = useActivatePreview(workflowId, true)
  const [mode, setMode] = useState<'future_only' | 'all'>('future_only')
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="text-lg font-semibold mb-1">Activate workflow</h2>
        <p className="text-xs text-[color:var(--muted)] mb-4">
          Decide how the workflow should apply to existing data.
        </p>
        {isLoading ? (
          <p className="text-sm text-[color:var(--muted)]">Checking impact…</p>
        ) : (
          <>
            <p className="text-sm text-[color:var(--muted)] mb-4">
              {preview?.entityType
                ? `This workflow triggers on ${preview.entityType}. There ${
                    preview.affectedCount === 1 ? 'is' : 'are'
                  } currently ${preview.affectedCount} matching record${preview.affectedCount === 1 ? '' : 's'}.`
                : 'This workflow runs on future events only.'}
            </p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)] transition-colors">
                <input
                  type="radio"
                  checked={mode === 'future_only'}
                  onChange={() => setMode('future_only')}
                />
                Run on new events only
              </label>
              {preview?.entityType && (
                <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)] transition-colors">
                  <input
                    type="radio"
                    checked={mode === 'all'}
                    onChange={() => setMode('all')}
                  />
                  Also back-fill existing {preview.affectedCount} record
                  {preview.affectedCount === 1 ? '' : 's'}
                </label>
              )}
            </div>
            {preview?.requiresConfirm && mode === 'all' && (
              <div className="mb-4 p-3 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-xs text-[color:var(--warning)]">
                This will enqueue {preview.affectedCount} runs. Proceed with care.
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton
            onClick={async () => {
              setConfirming(true)
              await onConfirm(mode)
              setConfirming(false)
            }}
            disabled={confirming}
          >
            {confirming ? 'Activating…' : 'Activate'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
