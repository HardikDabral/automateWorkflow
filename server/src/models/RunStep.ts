import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'

export type RunStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export interface RunStepDoc extends Document {
  _id: Types.ObjectId
  runId: string
  tenantId: Types.ObjectId
  stepId: string
  stepType: string
  status: RunStepStatus
  inputSnapshot?: Record<string, unknown>
  outputSnapshot?: Record<string, unknown>
  branchTaken?: 'yes' | 'no'
  conditionEvaluation?: Record<string, unknown>
  retryCount: number
  errorMessage?: string
  startedAt?: Date
  completedAt?: Date
}

const RunStepSchema = new Schema<RunStepDoc>(
  {
    runId: { type: String, required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    stepId: { type: String, required: true },
    stepType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'skipped', 'failed'],
      default: 'pending',
    },
    inputSnapshot: { type: Schema.Types.Mixed },
    outputSnapshot: { type: Schema.Types.Mixed },
    branchTaken: { type: String, enum: ['yes', 'no'] },
    conditionEvaluation: { type: Schema.Types.Mixed },
    retryCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: false },
)

RunStepSchema.index({ runId: 1, startedAt: 1 })
RunStepSchema.plugin(tenantScopePlugin)

export const RunStep = model<RunStepDoc>('RunStep', RunStepSchema)
