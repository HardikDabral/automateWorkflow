'use client'

import { create } from 'zustand'
import type { Step, StepType, WorkflowDefinition } from '@wf/shared'

const EMPTY_DEFINITION: WorkflowDefinition = {
  trigger: { type: 'event', event: '' },
  steps: [],
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function emptyConfigForType(type: StepType): Record<string, unknown> {
  switch (type) {
    case 'delay':
      return { duration_days: 0, duration_hours: 0 }
    case 'send_email':
      return { to: '', subject: '', body: '' }
    case 'slack':
      return { channel: '', message: '' }
    case 'http':
      return { method: 'POST', url: '', body: {} }
    case 'branch':
      return { field: '', operator: 'eq', value: '' }
    case 'loop':
      return { collection: '' }
    case 'create_record':
      return { entityType: '', fields: {} }
    case 'update_record':
      return { entityType: '', entityId: '', fields: {} }
    default:
      return {}
  }
}

export function newStep(type: StepType): Step {
  const base: Step = { id: randomId('step'), type, config: emptyConfigForType(type) }
  if (type === 'branch') {
    base.yesBranch = []
    base.noBranch = []
  }
  if (type === 'loop') {
    base.loopSteps = []
  }
  return base
}

interface WorkflowStoreState {
  definition: WorkflowDefinition
  isDirty: boolean
  selectedStepId: string | null
  setDefinition: (def: WorkflowDefinition, markDirty?: boolean) => void
  selectStep: (id: string | null) => void
  updateTrigger: (trigger: WorkflowDefinition['trigger']) => void
  addStep: (type: StepType) => void
  updateStep: (id: string, patch: Partial<Step>) => void
  updateStepConfig: (id: string, config: Record<string, unknown>) => void
  removeStep: (id: string) => void
  reset: () => void
  markSaved: () => void
}

function replaceStep(steps: Step[], id: string, updater: (s: Step) => Step): Step[] {
  return steps.map((s) => {
    if (s.id === id) return updater(s)
    const next = { ...s }
    if (s.yesBranch) next.yesBranch = replaceStep(s.yesBranch, id, updater)
    if (s.noBranch) next.noBranch = replaceStep(s.noBranch, id, updater)
    if (s.loopSteps) next.loopSteps = replaceStep(s.loopSteps, id, updater)
    return next
  })
}

function filterStep(steps: Step[], id: string): Step[] {
  return steps
    .filter((s) => s.id !== id)
    .map((s) => {
      const next = { ...s }
      if (s.yesBranch) next.yesBranch = filterStep(s.yesBranch, id)
      if (s.noBranch) next.noBranch = filterStep(s.noBranch, id)
      if (s.loopSteps) next.loopSteps = filterStep(s.loopSteps, id)
      return next
    })
}

export const useWorkflowStore = create<WorkflowStoreState>((set) => ({
  definition: EMPTY_DEFINITION,
  isDirty: false,
  selectedStepId: null,
  setDefinition: (def, markDirty = true) =>
    set({ definition: def, isDirty: markDirty }),
  selectStep: (id) => set({ selectedStepId: id }),
  updateTrigger: (trigger) =>
    set((s) => ({
      definition: { ...s.definition, trigger },
      isDirty: true,
    })),
  addStep: (type) =>
    set((s) => ({
      definition: { ...s.definition, steps: [...s.definition.steps, newStep(type)] },
      isDirty: true,
    })),
  updateStep: (id, patch) =>
    set((s) => ({
      definition: {
        ...s.definition,
        steps: replaceStep(s.definition.steps, id, (curr) => ({ ...curr, ...patch })),
      },
      isDirty: true,
    })),
  updateStepConfig: (id, config) =>
    set((s) => ({
      definition: {
        ...s.definition,
        steps: replaceStep(s.definition.steps, id, (curr) => ({ ...curr, config })),
      },
      isDirty: true,
    })),
  removeStep: (id) =>
    set((s) => ({
      definition: { ...s.definition, steps: filterStep(s.definition.steps, id) },
      selectedStepId: s.selectedStepId === id ? null : s.selectedStepId,
      isDirty: true,
    })),
  reset: () =>
    set({ definition: EMPTY_DEFINITION, isDirty: false, selectedStepId: null }),
  markSaved: () => set({ isDirty: false }),
}))

export function findStepById(steps: Step[], id: string): Step | null {
  for (const s of steps) {
    if (s.id === id) return s
    if (s.yesBranch) {
      const hit = findStepById(s.yesBranch, id)
      if (hit) return hit
    }
    if (s.noBranch) {
      const hit = findStepById(s.noBranch, id)
      if (hit) return hit
    }
    if (s.loopSteps) {
      const hit = findStepById(s.loopSteps, id)
      if (hit) return hit
    }
  }
  return null
}
