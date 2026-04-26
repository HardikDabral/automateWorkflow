export type RunStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'
export type RunStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export interface WorkflowRun {
  _id: string
  workflowId: string
  versionId: string
  tenantId: string
  triggerPayload: Record<string, unknown>
  entityId?: string
  entityType?: string
  status: RunStatus
  currentStepId?: string
  resumeAt?: string
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

export interface RunStep {
  _id: string
  runId: string
  tenantId: string
  stepId: string
  stepType: string
  status: RunStepStatus
  inputSnapshot?: Record<string, unknown>
  outputSnapshot?: Record<string, unknown>
  branchTaken?: 'yes' | 'no'
  conditionEvaluation?: Record<string, unknown>
  retryCount: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
}

export interface RunEvent {
  runId: string
  stepId?: string
  status: RunStatus | RunStepStatus
  type: 'run:started' | 'run:completed' | 'step:completed'
  completedAt?: string
  error?: string
}
