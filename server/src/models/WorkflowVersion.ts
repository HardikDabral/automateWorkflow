import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'
import type { WorkflowDefinition } from '@wf/shared'

export type AuthoredVia = 'ai_chat' | 'visual_builder'

export interface WorkflowVersionDoc extends Document {
  _id: Types.ObjectId
  workflowId: Types.ObjectId
  tenantId: Types.ObjectId
  versionNumber: number
  definition: WorkflowDefinition
  isDraft: boolean
  authoredVia: AuthoredVia
  aiSessionId?: string
  createdBy: Types.ObjectId
  createdAt: Date
}

const WorkflowVersionSchema = new Schema<WorkflowVersionDoc>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    versionNumber: { type: Number, required: true },
    definition: { type: Schema.Types.Mixed, required: true },
    isDraft: { type: Boolean, default: true },
    authoredVia: { type: String, enum: ['ai_chat', 'visual_builder'], required: true },
    aiSessionId: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

WorkflowVersionSchema.index({ workflowId: 1, versionNumber: 1 }, { unique: true })
WorkflowVersionSchema.plugin(tenantScopePlugin)

export const WorkflowVersion = model<WorkflowVersionDoc>('WorkflowVersion', WorkflowVersionSchema)
