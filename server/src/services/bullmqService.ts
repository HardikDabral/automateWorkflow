import { Queue, QueueEvents, JobsOptions } from 'bullmq'
import type { WorkflowDefinition } from '@wf/shared'
import { getRedis } from './redisService'

export interface WorkflowJobData {
  runId: string
  workflowId: string
  versionId: string
  tenantId: string
  definition: WorkflowDefinition
  triggerPayload: Record<string, unknown>
  entityId?: string
  entityType?: string
  currentStepIndex: number
  /** Path for nested steps, e.g. ['step-3', 'yes', 'step-3a']. */
  stepPath?: string[]
}

export const WORKFLOW_JOB_NAME = 'run-workflow'

let queue: Queue<WorkflowJobData> | null = null
let events: QueueEvents | null = null

function queueName(): string {
  return process.env.BULL_QUEUE_NAME || 'workflow-execution'
}

export function getWorkflowQueue(): Queue<WorkflowJobData> {
  if (!queue) {
    queue = new Queue<WorkflowJobData>(queueName(), { connection: getRedis() })
  }
  return queue
}

export function getWorkflowQueueEvents(): QueueEvents {
  if (!events) {
    events = new QueueEvents(queueName(), { connection: getRedis() })
  }
  return events
}

export async function enqueueWorkflowRun(
  data: WorkflowJobData,
  options?: JobsOptions,
): Promise<string> {
  const q = getWorkflowQueue()
  const job = await q.add(WORKFLOW_JOB_NAME, data, {
    jobId: data.runId,
    attempts: Number(process.env.BULL_MAX_ATTEMPTS || 3),
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    ...options,
  })
  return String(job.id ?? data.runId)
}

export async function enqueueDelayedStep(
  data: WorkflowJobData,
  delayMs: number,
  stepId: string,
): Promise<string> {
  const q = getWorkflowQueue()
  const job = await q.add(WORKFLOW_JOB_NAME, data, {
    delay: delayMs,
    jobId: `${data.runId}-step-${stepId}`,
    attempts: Number(process.env.BULL_MAX_ATTEMPTS || 3),
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  })
  return String(job.id ?? `${data.runId}-step-${stepId}`)
}

/** Remove any queued jobs (parent + pending delayed steps) for a runId. */
export async function removeRunFromQueue(runId: string): Promise<void> {
  const q = getWorkflowQueue()
  const parent = await q.getJob(runId)
  if (parent) await parent.remove().catch(() => undefined)

  // Best-effort: scan for delayed step jobs of this run and remove them.
  const delayed = await q.getDelayed(0, 500)
  await Promise.all(
    delayed
      .filter((j) => typeof j.id === 'string' && j.id.startsWith(`${runId}-step-`))
      .map((j) => j.remove().catch(() => undefined)),
  )
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close()
    queue = null
  }
  if (events) {
    await events.close()
    events = null
  }
}
