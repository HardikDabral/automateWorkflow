import mongoose, { Types } from 'mongoose'
import type { Job } from 'bullmq'
import type { Step, WorkflowDefinition } from '@wf/shared'
import {
  WorkflowRun,
  RunStep,
} from '../../../server/src/models'
import {
  getPublisher,
  runEventsChannel,
} from '../../../server/src/services/redisService'
import {
  enqueueDelayedStep,
  type WorkflowJobData,
} from '../../../server/src/services/bullmqService'
import { tenantStorage } from '../../../server/src/context/tenantContext'

import type { AtomicStepHandler, StepContext } from './steps/types'
import { emailStep } from './steps/emailStep'
import { slackStep } from './steps/slackStep'
import { httpStep } from './steps/httpStep'
import { createRecordStep, updateRecordStep } from './steps/recordStep'
import { evaluateBranch } from './steps/branchStep'
import { resolveVariables } from './variableResolver'

const atomicHandlers: Record<string, AtomicStepHandler> = {
  send_email: emailStep,
  slack: slackStep,
  http: httpStep,
  create_record: createRecordStep,
  update_record: updateRecordStep,
}

class SuspendedForDelay {
  constructor(public readonly nextIndex: number, public readonly delayMs: number) {}
}

export async function processWorkflowJob(job: Job<WorkflowJobData>): Promise<void> {
  const data = job.data
  await tenantStorage.run(
    { tenantId: data.tenantId, userId: 'worker', role: 'admin' },
    () => runJob(data),
  )
}

async function runJob(data: WorkflowJobData): Promise<void> {
  const run = await WorkflowRun.findById(data.runId)
  if (!run) {
    console.warn('[worker] run not found', data.runId)
    return
  }
  if (run.status === 'cancelled' || run.status === 'completed' || run.status === 'failed') {
    return
  }
  if (run.status !== 'running') {
    run.status = 'running'
    await run.save()
    if (data.currentStepIndex === 0) {
      await publish(data.tenantId, {
        type: 'run:started',
        runId: data.runId,
        status: 'running',
        startedAt: (run.startedAt ?? new Date()).toISOString(),
      })
    }
  }

  const ctx: StepContext = {
    runId: data.runId,
    tenantId: data.tenantId,
    triggerPayload: data.triggerPayload,
    getLiveEntity: () => loadLiveEntity(run.entityType, run.entityId, data.tenantId),
  }

  try {
    await executeSteps(data.definition.steps, data.currentStepIndex, ctx, data)

    // executeSteps returned without suspending → the workflow is done.
    run.status = 'completed'
    run.completedAt = new Date()
    await run.save()
    await publish(data.tenantId, {
      type: 'run:completed',
      runId: data.runId,
      status: 'completed',
      completedAt: run.completedAt.toISOString(),
    })
  } catch (err) {
    if (err instanceof SuspendedForDelay) {
      // A delay step scheduled a continuation. Leave run in 'waiting' state.
      run.status = 'waiting'
      run.resumeAt = new Date(Date.now() + err.delayMs)
      await run.save()
      return
    }
    run.status = 'failed'
    run.errorMessage = err instanceof Error ? err.message : String(err)
    run.completedAt = new Date()
    await run.save()
    await publish(data.tenantId, {
      type: 'run:completed',
      runId: data.runId,
      status: 'failed',
      error: run.errorMessage,
    })
    throw err // let BullMQ mark job as failed + retry
  }
}

/**
 * Execute a flat list of sibling steps starting at `startIdx`. Branch/loop
 * children are executed inline (synchronous within the job). A `delay` at
 * this level suspends by re-enqueuing and throws SuspendedForDelay.
 *
 * Limitation: delays inside branch/loop bodies run the delay synchronously
 * (no suspend). Top-level delay is the supported resume case.
 */
async function executeSteps(
  steps: Step[],
  startIdx: number,
  ctx: StepContext,
  data: WorkflowJobData,
): Promise<void> {
  for (let i = startIdx; i < steps.length; i++) {
    const step = steps[i]

    if (step.type === 'delay') {
      const ms = computeDelayMs(step)
      if (ms > 0) {
        await enqueueDelayedStep(
          { ...data, currentStepIndex: i + 1 },
          ms,
          step.id,
        )
        // Record the delay step as completed (it's not running — it's scheduling).
        await recordRunStep({
          runId: ctx.runId,
          tenantId: ctx.tenantId,
          stepId: step.id,
          stepType: 'delay',
          status: 'completed',
          inputSnapshot: step.config,
          outputSnapshot: { resumeInMs: ms },
          startedAt: new Date(),
          completedAt: new Date(),
        })
        await publish(ctx.tenantId, {
          type: 'step:completed',
          runId: ctx.runId,
          stepId: step.id,
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
        throw new SuspendedForDelay(i + 1, ms)
      }
      // zero-ms delay → treat as no-op, continue
      continue
    }

    if (step.type === 'branch') {
      const started = new Date()
      const evalResult = await evaluateBranch(step, ctx)
      const children = evalResult.branchTaken === 'yes' ? step.yesBranch ?? [] : step.noBranch ?? []
      await recordRunStep({
        runId: ctx.runId,
        tenantId: ctx.tenantId,
        stepId: step.id,
        stepType: 'branch',
        status: 'completed',
        inputSnapshot: step.config,
        branchTaken: evalResult.branchTaken,
        conditionEvaluation: evalResult.conditionEvaluation,
        startedAt: started,
        completedAt: new Date(),
      })
      await publish(ctx.tenantId, {
        type: 'step:completed',
        runId: ctx.runId,
        stepId: step.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      await executeSteps(children, 0, ctx, data)
      continue
    }

    if (step.type === 'loop') {
      const started = new Date()
      const config = resolveVariables(step.config, ctx.triggerPayload) as { collection?: unknown }
      const items = Array.isArray(config.collection) ? config.collection : []
      for (const item of items) {
        const iterCtx: StepContext = {
          ...ctx,
          triggerPayload: { ...ctx.triggerPayload, item },
        }
        await executeSteps(step.loopSteps ?? [], 0, iterCtx, data)
      }
      await recordRunStep({
        runId: ctx.runId,
        tenantId: ctx.tenantId,
        stepId: step.id,
        stepType: 'loop',
        status: 'completed',
        inputSnapshot: step.config,
        outputSnapshot: { iterations: items.length },
        startedAt: started,
        completedAt: new Date(),
      })
      await publish(ctx.tenantId, {
        type: 'step:completed',
        runId: ctx.runId,
        stepId: step.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      continue
    }

    // atomic step
    const handler = atomicHandlers[step.type]
    if (!handler) {
      throw new Error(`unknown step type: ${step.type}`)
    }

    const started = new Date()
    await recordRunStep({
      runId: ctx.runId,
      tenantId: ctx.tenantId,
      stepId: step.id,
      stepType: step.type,
      status: 'running',
      inputSnapshot: step.config,
      startedAt: started,
    })
    const result = await handler(step, ctx)

    await RunStep.updateOne(
      { runId: ctx.runId, stepId: step.id, startedAt: started },
      {
        $set: {
          status: result.kind === 'ok' ? 'completed' : 'failed',
          outputSnapshot: result.output,
          errorMessage: result.error,
          completedAt: new Date(),
        },
      },
    )
    await publish(ctx.tenantId, {
      type: 'step:completed',
      runId: ctx.runId,
      stepId: step.id,
      status: result.kind === 'ok' ? 'completed' : 'failed',
      completedAt: new Date().toISOString(),
      error: result.error,
    })

    if (result.kind === 'failed') {
      // Propagate as a thrown error so the run is marked failed.
      throw new Error(result.error || `step ${step.id} failed`)
    }
  }
}

function computeDelayMs(step: Step): number {
  const cfg = step.config as { duration_days?: number; duration_hours?: number }
  const days = Number(cfg.duration_days || 0)
  const hours = Number(cfg.duration_hours || 0)
  return Math.max(0, days * 86_400_000 + hours * 3_600_000)
}

// ── persistence helpers ─────────────────────────────────────────────────

interface RecordStepInput {
  runId: string
  tenantId: string
  stepId: string
  stepType: string
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed'
  inputSnapshot?: Record<string, unknown>
  outputSnapshot?: Record<string, unknown>
  branchTaken?: 'yes' | 'no'
  conditionEvaluation?: Record<string, unknown>
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
}

async function recordRunStep(input: RecordStepInput): Promise<void> {
  await RunStep.create({
    runId: input.runId,
    tenantId: new Types.ObjectId(input.tenantId),
    stepId: input.stepId,
    stepType: input.stepType,
    status: input.status,
    inputSnapshot: input.inputSnapshot,
    outputSnapshot: input.outputSnapshot,
    branchTaken: input.branchTaken,
    conditionEvaluation: input.conditionEvaluation,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    errorMessage: input.errorMessage,
  })
}

async function loadLiveEntity(
  entityType: string | undefined,
  entityId: string | undefined,
  tenantId: string,
): Promise<Record<string, unknown> | null> {
  if (!entityType || !entityId) return null
  const db = mongoose.connection.db
  if (!db) return null
  let id: unknown = entityId
  if (mongoose.isValidObjectId(entityId)) id = new mongoose.Types.ObjectId(entityId)
  const doc = await db.collection(entityType).findOne({ _id: id as never, tenantId })
  return doc as Record<string, unknown> | null
}

async function publish(tenantId: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await getPublisher().publish(runEventsChannel(tenantId), JSON.stringify(payload))
  } catch (err) {
    console.warn('[worker] publish failed', err)
  }
}
