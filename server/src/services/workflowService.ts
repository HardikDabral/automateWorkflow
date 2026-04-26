import mongoose, { Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { Workflow, WorkflowVersion, WorkflowRun } from '../models'
import { requireTenantId, getRequestContext } from '../context/tenantContext'
import { enqueueWorkflowRun } from './bullmqService'
import { consumeTestRun } from './quotaService'
import type {
  CreateWorkflowInput,
  CreateVersionInput,
  ActivateInput,
} from '../validators/workflowSchema'

export async function listWorkflows() {
  return Workflow.find().sort({ updatedAt: -1 }).lean()
}

export async function createWorkflow(input: CreateWorkflowInput) {
  const ctx = getRequestContext()
  if (!ctx) throw new Error('Missing auth context')

  const wf = await Workflow.create({
    name: input.name,
    description: input.description,
    createdBy: new Types.ObjectId(ctx.userId),
  })
  return wf.toObject()
}

export async function getWorkflow(id: string) {
  const wf = await Workflow.findById(id).populate('activeVersionId').lean()
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })
  return wf
}

export async function createVersion(workflowId: string, input: CreateVersionInput) {
  const ctx = getRequestContext()
  if (!ctx) throw new Error('Missing auth context')

  const wf = await Workflow.findById(workflowId).lean()
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })

  const latest = await WorkflowVersion.findOne({ workflowId }).sort({ versionNumber: -1 }).lean()
  const versionNumber = (latest?.versionNumber ?? 0) + 1

  const created = await WorkflowVersion.create({
    workflowId: new Types.ObjectId(workflowId),
    versionNumber,
    definition: input.definition,
    isDraft: true,
    authoredVia: input.authoredVia,
    aiSessionId: input.aiSessionId,
    createdBy: new Types.ObjectId(ctx.userId),
  })
  return created.toObject()
}

export async function activatePreview(workflowId: string) {
  const tenantId = requireTenantId()

  const wf = await Workflow.findById(workflowId).populate('activeVersionId').lean()
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })

  const def = (wf.activeVersionId as any)?.definition
    ?? (await WorkflowVersion.findOne({ workflowId }).sort({ versionNumber: -1 }).lean())?.definition

  const entityType = entityFromTrigger(def?.trigger)
  if (!entityType) return { affectedCount: 0, requiresConfirm: false, entityType: null }

  const count = await countEntityForTenant(entityType, tenantId)
  return { affectedCount: count, requiresConfirm: count > 100, entityType }
}

export async function activateWorkflow(workflowId: string, _input: ActivateInput) {
  const wf = await Workflow.findById(workflowId)
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })

  const latest = await WorkflowVersion.findOne({ workflowId }).sort({ versionNumber: -1 })
  if (!latest) throw Object.assign(new Error('No versions to activate'), { status: 400 })

  latest.isDraft = false
  await latest.save()

  wf.status = 'active'
  wf.activeVersionId = latest._id as any
  await wf.save()

  // NOTE: activateFrom === 'all' would enqueue runs for each existing entity.
  // Left as a follow-up once live-entity collections are connected.
  return wf.toObject()
}

export async function testRunWorkflow(workflowId: string, triggerPayload: Record<string, unknown>) {
  const tenantId = requireTenantId()

  // Gate before doing any work so a 402 leaves no orphan WorkflowRun row.
  await consumeTestRun()

  const wf = await Workflow.findById(workflowId)
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })

  // Test run always uses the latest saved version (draft or active), so you
  // can iterate without re-activating. Production event-triggered runs should
  // use activeVersionId — that's the promotion boundary.
  const version = await WorkflowVersion.findOne({ workflowId }).sort({ versionNumber: -1 })
  if (!version) throw Object.assign(new Error('No version to run'), { status: 400 })

  const runId = uuidv4()
  const run = await WorkflowRun.create({
    _id: runId,
    workflowId: wf._id,
    versionId: version._id,
    triggerPayload,
    status: 'running',
    startedAt: new Date(),
  })

  await enqueueWorkflowRun({
    runId,
    workflowId: String(wf._id),
    versionId: String(version._id),
    tenantId,
    definition: version.definition,
    triggerPayload,
    currentStepIndex: 0,
  })

  return run.toObject()
}

export async function pauseWorkflow(workflowId: string) {
  const wf = await Workflow.findById(workflowId)
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 })
  wf.status = 'paused'
  await wf.save()
  return wf.toObject()
}

// ── trigger helpers ──────────────────────────────────────────────────────

/** Map trigger event to the entity collection name, best-effort. */
function entityFromTrigger(trigger: any): string | null {
  if (!trigger || trigger.type !== 'event' || !trigger.event) return null
  const prefix = String(trigger.event).split('.')[0]
  if (!prefix) return null
  return pluralize(prefix)
}

function pluralize(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es'
  if (/y$/i.test(word)) return word.slice(0, -1) + 'ies'
  return word + 's'
}

async function countEntityForTenant(entityType: string, tenantId: string): Promise<number> {
  const db = mongoose.connection.db
  if (!db) return 0
  // Collections may not exist yet — treat as 0.
  const collections = await db
    .listCollections({ name: entityType }, { nameOnly: true })
    .toArray()
  if (collections.length === 0) return 0
  return db.collection(entityType).countDocuments({ tenantId })
}
