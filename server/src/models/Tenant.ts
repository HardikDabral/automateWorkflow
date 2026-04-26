import { Schema, model, Document, Types } from 'mongoose'

export interface TenantDoc extends Document {
  _id: Types.ObjectId
  name: string
  slug: string
  plan: 'trial' | 'pro' | 'enterprise'
  timezone: string
  aiCallsUsed: number
  testRunsUsed: number
  createdAt: Date
}

const TenantSchema = new Schema<TenantDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ['trial', 'pro', 'enterprise'], default: 'trial' },
    timezone: { type: String, default: 'UTC' },
    aiCallsUsed: { type: Number, default: 0 },
    testRunsUsed: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// Tenant itself is the root — no tenant scoping applied.
export const Tenant = model<TenantDoc>('Tenant', TenantSchema)
