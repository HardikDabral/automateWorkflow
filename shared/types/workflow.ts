export type {
  Step,
  StepType,
  Trigger,
  WorkflowDefinition,
} from '../validators/workflowSchema'

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived'
export type AuthoredVia = 'ai_chat' | 'visual_builder'

export interface Workflow {
  _id: string
  tenantId: string
  name: string
  description?: string
  status: WorkflowStatus
  activeVersionId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowVersion {
  _id: string
  workflowId: string
  tenantId: string
  versionNumber: number
  definition: import('../validators/workflowSchema').WorkflowDefinition
  isDraft: boolean
  authoredVia: AuthoredVia
  aiSessionId?: string
  createdBy: string
  createdAt: string
}
