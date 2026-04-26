import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived'

export interface WorkflowDoc extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  name: string
  description?: string
  status: WorkflowStatus
  activeVersionId?: Types.ObjectId
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const WorkflowSchema = new Schema<WorkflowDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
      index: true,
    },
    activeVersionId: { type: Schema.Types.ObjectId, ref: 'WorkflowVersion' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

WorkflowSchema.plugin(tenantScopePlugin)

export const Workflow = model<WorkflowDoc>('Workflow', WorkflowSchema)
