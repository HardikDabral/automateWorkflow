import { WorkflowRun, RunStep } from '../models'
import { removeRunFromQueue } from './bullmqService'

export async function listRunsForWorkflow(workflowId: string, limit = 20, skip = 0) {
  const [items, total] = await Promise.all([
    WorkflowRun.find({ workflowId }).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
    WorkflowRun.countDocuments({ workflowId }),
  ])
  return { items, total, limit, skip }
}

export async function getRun(runId: string) {
  const run = await WorkflowRun.findById(runId).lean()
  if (!run) throw Object.assign(new Error('Run not found'), { status: 404 })
  const steps = await RunStep.find({ runId }).sort({ startedAt: 1, _id: 1 }).lean()
  return { run, steps }
}

export async function cancelRun(runId: string) {
  const run = await WorkflowRun.findById(runId)
  if (!run) throw Object.assign(new Error('Run not found'), { status: 404 })
  if (run.status === 'completed' || run.status === 'cancelled' || run.status === 'failed') {
    return run.toObject()
  }

  await removeRunFromQueue(runId)

  run.status = 'cancelled'
  run.completedAt = new Date()
  await run.save()
  return run.toObject()
}
