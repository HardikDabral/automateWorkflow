'use client'

import { useMemo, useState, useEffect } from 'react'
import { X, ChevronRight, SlidersHorizontal } from 'lucide-react'
import type { Step } from '@wf/shared'
import { findStepById, useWorkflowStore } from '@/store/workflowStore'
import { useVocabulary } from '@/hooks/useVocabulary'

export function ConfigPanel({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const selectedId = useWorkflowStore((s) => s.selectedStepId)
  const steps = useWorkflowStore((s) => s.definition.steps)
  const trigger = useWorkflowStore((s) => s.definition.trigger)
  const updateTrigger = useWorkflowStore((s) => s.updateTrigger)
  const updateStepConfig = useWorkflowStore((s) => s.updateStepConfig)
  const removeStep = useWorkflowStore((s) => s.removeStep)
  const select = useWorkflowStore((s) => s.selectStep)

  const step = useMemo(() => (selectedId ? findStepById(steps, selectedId) : null), [steps, selectedId])

  const { data: vocab } = useVocabulary()

  if (collapsed) {
    return (
      <aside className="h-full w-full lg:w-12 shrink-0 border-l border-[color:var(--border)] bg-[color:var(--surface)] flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="h-9 w-9 grid place-items-center rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
          title="Expand configuration"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <div className="mt-3 text-[10px] uppercase tracking-wider text-[color:var(--muted-2)] [writing-mode:vertical-rl] rotate-180">
          {step ? step.type : 'trigger'}
        </div>
      </aside>
    )
  }

  return (
    <aside className="h-full w-full lg:w-[360px] shrink-0 border-l border-[color:var(--border)] bg-[color:var(--surface)] flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-2)]">
            {step ? 'Step' : 'Trigger'}
          </div>
          <h3 className="text-sm font-semibold mt-0.5">
            {step ? step.type : 'Configure trigger'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {step && (
            <button
              onClick={() => select(null)}
              className="h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
              title="Deselect"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            className="h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
            title="Collapse"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 text-sm">
        {step ? (
          <StepEditor
            step={step}
            onChange={(config) => updateStepConfig(step.id, config)}
            onRemove={() => removeStep(step.id)}
          />
        ) : (
          <TriggerEditor
            trigger={trigger}
            events={vocab?.entityEvents ?? []}
            onChange={updateTrigger}
          />
        )}
      </div>
    </aside>
  )
}

function TriggerEditor({
  trigger,
  events,
  onChange,
}: {
  trigger: { type: 'event' | 'schedule'; event?: string; cron?: string; timezone?: string }
  events: string[]
  onChange: (t: { type: 'event' | 'schedule'; event?: string; cron?: string; timezone?: string }) => void
}) {
  return (
    <div className="space-y-3">
      <Field label="Trigger type">
        <select
          value={trigger.type}
          onChange={(e) =>
            onChange({ type: e.target.value as 'event' | 'schedule', event: '', cron: '' })
          }
          className={inputClass}
        >
          <option value="event">Event</option>
          <option value="schedule">Schedule</option>
        </select>
      </Field>
      {trigger.type === 'event' ? (
        <Field label="Event">
          <select
            value={trigger.event ?? ''}
            onChange={(e) => onChange({ ...trigger, event: e.target.value })}
            className={inputClass}
          >
            <option value="">(choose an event)</option>
            {events.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Cron">
            <input
              value={trigger.cron ?? ''}
              onChange={(e) => onChange({ ...trigger, cron: e.target.value })}
              placeholder="0 9 * * MON"
              className={inputClass}
            />
          </Field>
          <Field label="Timezone">
            <input
              value={trigger.timezone ?? ''}
              onChange={(e) => onChange({ ...trigger, timezone: e.target.value })}
              placeholder="America/New_York"
              className={inputClass}
            />
          </Field>
        </>
      )}
    </div>
  )
}

function StepEditor({
  step,
  onChange,
  onRemove,
}: {
  step: Step
  onChange: (config: Record<string, unknown>) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-[11px] text-[color:var(--muted-2)] font-mono px-3 py-1.5 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] inline-block">
        id: {step.id}
      </div>
      <TypeSpecificEditor step={step} onChange={onChange} />
      <button
        onClick={onRemove}
        className="w-full h-10 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 text-[color:var(--danger)] text-sm font-medium hover:bg-[color:var(--danger)]/20 transition-colors"
      >
        Remove step
      </button>
    </div>
  )
}

function TypeSpecificEditor({
  step,
  onChange,
}: {
  step: Step
  onChange: (config: Record<string, unknown>) => void
}) {
  const c = step.config as Record<string, unknown>
  const set = (patch: Record<string, unknown>) => onChange({ ...c, ...patch })

  switch (step.type) {
    case 'delay':
      return (
        <>
          <Field label="Days">
            <input
              type="number"
              min={0}
              value={Number(c.duration_days || 0)}
              onChange={(e) => set({ duration_days: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Hours">
            <input
              type="number"
              min={0}
              value={Number(c.duration_hours || 0)}
              onChange={(e) => set({ duration_hours: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </>
      )
    case 'send_email':
      return (
        <>
          <Field label="To">
            <input
              value={String(c.to ?? '')}
              onChange={(e) => set({ to: e.target.value })}
              placeholder="{{lead.email}}"
              className={inputClass}
            />
          </Field>
          <Field label="Subject">
            <input
              value={String(c.subject ?? '')}
              onChange={(e) => set({ subject: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Body">
            <textarea
              value={String(c.body ?? '')}
              onChange={(e) => set({ body: e.target.value })}
              rows={6}
              className={inputClass}
            />
          </Field>
        </>
      )
    case 'slack':
      return (
        <>
          <Field label="Channel">
            <input
              value={String(c.channel ?? '')}
              onChange={(e) => set({ channel: e.target.value })}
              placeholder="#sales"
              className={inputClass}
            />
          </Field>
          <Field label="Message">
            <textarea
              value={String(c.message ?? '')}
              onChange={(e) => set({ message: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </Field>
        </>
      )
    case 'http':
      return (
        <>
          <Field label="Method">
            <select
              value={String(c.method ?? 'POST')}
              onChange={(e) => set({ method: e.target.value })}
              className={inputClass}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </Field>
          <Field label="URL">
            <input
              value={String(c.url ?? '')}
              onChange={(e) => set({ url: e.target.value })}
              className={inputClass}
            />
          </Field>
          <JsonField label="Body" value={c.body} onChange={(v) => set({ body: v })} />
        </>
      )
    case 'branch':
      return (
        <>
          <Field label="Field">
            <input
              value={String(c.field ?? '')}
              onChange={(e) => set({ field: e.target.value })}
              placeholder="stage"
              className={inputClass}
            />
          </Field>
          <Field label="Operator">
            <select
              value={String(c.operator ?? 'eq')}
              onChange={(e) => set({ operator: e.target.value })}
              className={inputClass}
            >
              {['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'exists'].map((op) => (
                <option key={op}>{op}</option>
              ))}
            </select>
          </Field>
          <JsonField label="Value" value={c.value} onChange={(v) => set({ value: v })} />
        </>
      )
    case 'loop':
      return (
        <Field label="Collection (variable path)">
          <input
            value={String(c.collection ?? '')}
            onChange={(e) => set({ collection: e.target.value })}
            placeholder="{{lead.activities}}"
            className={inputClass}
          />
        </Field>
      )
    case 'create_record':
      return (
        <>
          <Field label="Entity type">
            <input
              value={String(c.entityType ?? '')}
              onChange={(e) => set({ entityType: e.target.value })}
              placeholder="notes"
              className={inputClass}
            />
          </Field>
          <JsonField label="Fields" value={c.fields} onChange={(v) => set({ fields: v })} />
        </>
      )
    case 'update_record':
      return (
        <>
          <Field label="Entity type">
            <input
              value={String(c.entityType ?? '')}
              onChange={(e) => set({ entityType: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Entity id">
            <input
              value={String(c.entityId ?? '')}
              onChange={(e) => set({ entityId: e.target.value })}
              placeholder="{{lead._id}}"
              className={inputClass}
            />
          </Field>
          <JsonField label="Fields" value={c.fields} onChange={(v) => set({ fields: v })} />
        </>
      )
    default:
      return <div className="text-[color:var(--muted)]">No editor for type {step.type}</div>
  }
}

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (v: unknown) => void
}) {
  const [text, setText] = useState<string>(() =>
    value === undefined ? '' : JSON.stringify(value, null, 2),
  )
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setText(value === undefined ? '' : JSON.stringify(value, null, 2))
  }, [value])

  return (
    <Field label={label}>
      <textarea
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          if (!raw.trim()) {
            setErr(null)
            onChange({})
            return
          }
          try {
            onChange(JSON.parse(raw))
            setErr(null)
          } catch (e) {
            setErr((e as Error).message)
          }
        }}
        rows={5}
        className={`${inputClass} font-mono text-xs`}
        placeholder='{"key": "value"}'
      />
      {err && <span className="mt-1 block text-xs text-[color:var(--danger)]">{err}</span>}
    </Field>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-[color:var(--muted)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

const inputClass =
  'w-full rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--border-strong)] focus:ring-4 focus:ring-[color:var(--ring)]'
