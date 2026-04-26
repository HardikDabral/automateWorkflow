import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'

export interface UserDoc extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  email: string
  passwordHash: string
  role: 'admin' | 'member'
  timezone?: string
  createdAt: Date
}

const UserSchema = new Schema<UserDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    email: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    timezone: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true })
UserSchema.plugin(tenantScopePlugin)

export const User = model<UserDoc>('User', UserSchema)
