'use client'

import { Handle, Position } from '@xyflow/react'
import type { Step } from '@wf/shared'
import {
  Clock,
  Mail,
  MessageSquare,
  Globe,
  GitBranch,
  Repeat,
  Database,
  FileEdit,
  Zap,
  HelpCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/store/workflowStore'

interface StepNodeProps {
  id: string
  data: { step: Step }
  selected?: boolean
}

const META: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  delay: { label: 'Delay', icon: Clock, color: 'text-[color:var(--warning)]' },
  send_email: { label: 'Send email', icon: Mail, color: 'text-sky-400' },
  slack: { label: 'Slack', icon: MessageSquare, color: 'text-violet-400' },
  http: { label: 'HTTP', icon: Globe, color: 'text-[color:var(--success)]' },
  branch: { label: 'Branch', icon: GitBranch, color: 'text-pink-400' },
  loop: { label: 'Loop', icon: Repeat, color: 'text-cyan-400' },
  create_record: { label: 'Create record', icon: Database, color: 'text-lime-400' },
  update_record: { label: 'Update record', icon: FileEdit, color: 'text-orange-400' },
}

export function StepNode({ id, data, selected }: StepNodeProps) {
  const step = data.step
  const meta = META[step.type] ?? { label: step.type, icon: HelpCircle, color: 'text-slate-300' }
  const Icon = meta.icon
  const selectedId = useWorkflowStore((s) => s.selectedStepId)
  const isSelected = selected || selectedId === id

  const summary = summarizeConfig(step)

  return (
    <div
      className={cn(
        'rounded-2xl border bg-[color:var(--surface)] px-4 py-3 w-[220px] transition-all',
        isSelected
          ? 'border-white ring-2 ring-white/20'
          : 'border-[color:var(--border)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)]',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[color:var(--border-strong)] !border-[color:var(--surface)]" />
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] grid place-items-center">
          <Icon className={cn('h-3.5 w-3.5', meta.color)} />
        </div>
        <span className="text-sm font-medium">{meta.label}</span>
      </div>
      <div className="mt-2 text-xs text-[color:var(--muted)] truncate">{summary}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-[color:var(--border-strong)] !border-[color:var(--surface)]" />
    </div>
  )
}

export function TriggerNode({ data }: { data: { trigger: { type: string; event?: string; cron?: string } } }) {
  const t = data.trigger
  const label = t.type === 'event' ? t.event || '(event)' : t.cron || '(schedule)'
  return (
    <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-[color:var(--surface-2)] to-[color:var(--surface)] px-4 py-3 w-[220px]">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-white/10 grid place-items-center">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-medium">Trigger</span>
      </div>
      <div className="mt-2 text-xs text-[color:var(--muted)] truncate">{label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-white/60 !border-[color:var(--surface)]" />
    </div>
  )
}

function summarizeConfig(step: Step): string {
  const c = step.config as Record<string, unknown>
  switch (step.type) {
    case 'delay': {
      const d = Number(c.duration_days || 0)
      const h = Number(c.duration_hours || 0)
      if (!d && !h) return '(no delay)'
      return [d ? `${d}d` : null, h ? `${h}h` : null].filter(Boolean).join(' ')
    }
    case 'send_email':
      return String(c.subject || c.to || '(email)')
    case 'slack':
      return String(c.channel || '(slack)')
    case 'http':
      return `${String(c.method || 'GET')} ${String(c.url || '')}`
    case 'branch':
      return `${String(c.field || '')} ${String(c.operator || '')} ${JSON.stringify(c.value ?? '')}`
    case 'loop':
      return String(c.collection || '(collection)')
    case 'create_record':
      return String(c.entityType || '(entity)')
    case 'update_record':
      return String(c.entityType || '(entity)')
    default:
      return ''
  }
}
