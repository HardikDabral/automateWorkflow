import type { Step } from '@wf/shared'

export interface StepContext {
  runId: string
  tenantId: string
  triggerPayload: Record<string, unknown>
  /** Live entity state, loaded on demand for branch evaluation. */
  getLiveEntity: () => Promise<Record<string, unknown> | null>
}

export interface AtomicStepResult {
  kind: 'ok' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

export type AtomicStepHandler = (step: Step, ctx: StepContext) => Promise<AtomicStepResult>
