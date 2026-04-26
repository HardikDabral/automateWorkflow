import mongoose from 'mongoose'
import type { AtomicStepHandler } from './types'
import { resolveVariables } from '../variableResolver'

interface CreateConfig {
  entityType: string
  fields: Record<string, unknown>
}
interface UpdateConfig {
  entityType: string
  entityId: string
  fields: Record<string, unknown>
}

export const createRecordStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<CreateConfig>
  if (!config.entityType || !config.fields) {
    return { kind: 'failed', error: 'create_record: missing entityType or fields' }
  }
  const db = mongoose.connection.db
  if (!db) return { kind: 'failed', error: 'create_record: no db connection' }

  const doc = { ...config.fields, tenantId: ctx.tenantId, createdAt: new Date() }
  const result = await db.collection(config.entityType).insertOne(doc)
  return { kind: 'ok', output: { insertedId: String(result.insertedId), entityType: config.entityType } }
}

export const updateRecordStep: AtomicStepHandler = async (step, ctx) => {
  const config = resolveVariables(step.config, ctx.triggerPayload) as Partial<UpdateConfig>
  if (!config.entityType || !config.entityId || !config.fields) {
    return { kind: 'failed', error: 'update_record: missing entityType, entityId, or fields' }
  }
  const db = mongoose.connection.db
  if (!db) return { kind: 'failed', error: 'update_record: no db connection' }

  let filterId: unknown = config.entityId
  if (mongoose.isValidObjectId(config.entityId)) {
    filterId = new mongoose.Types.ObjectId(config.entityId)
  }
  const result = await db.collection(config.entityType).updateOne(
    { _id: filterId as any, tenantId: ctx.tenantId },
    { $set: { ...config.fields, updatedAt: new Date() } },
  )
  return {
    kind: 'ok',
    output: {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      entityType: config.entityType,
    },
  }
}
