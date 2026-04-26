import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'

export type RunStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowRunDoc extends Document<string> {
  _id: string // BullMQ job id
  workflowId: Types.ObjectId
  versionId: Types.ObjectId
  tenantId: Types.ObjectId
  triggerPayload: Record<string, unknown>
  entityId?: string
  entityType?: string
  status: RunStatus
  currentStepId?: string
  resumeAt?: Date
  startedAt: Date
  completedAt?: Date
  errorMessage?: string
}

const WorkflowRunSchema = new Schema<WorkflowRunDoc>(
  {
    _id: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'WorkflowVersion', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    triggerPayload: { type: Schema.Types.Mixed, default: {} },
    entityId: { type: String },
    entityType: { type: String },
    status: {
      type: String,
      enum: ['running', 'waiting', 'completed', 'failed', 'cancelled'],
      default: 'running',
      index: true,
    },
    currentStepId: { type: String },
    resumeAt: { type: Date },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    errorMessage: { type: String },
  },
  { _id: false, timestamps: false },
)

WorkflowRunSchema.plugin(tenantScopePlugin)

export const WorkflowRun = model<WorkflowRunDoc>('WorkflowRun', WorkflowRunSchema)
