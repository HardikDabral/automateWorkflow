import '../../server/src/loadEnv'
import { Worker } from 'bullmq'
import { connectMongo } from '../../server/src/services/mongoService'
import { getRedis } from '../../server/src/services/redisService'
import { WORKFLOW_JOB_NAME, type WorkflowJobData } from '../../server/src/services/bullmqService'
import { processWorkflowJob } from './processors/workflowProcessor'

let started: Worker<WorkflowJobData> | null = null

export function startWorker(): Worker<WorkflowJobData> {
  if (started) return started
  const queueName = process.env.BULL_QUEUE_NAME || 'workflow-execution'

  const worker = new Worker<WorkflowJobData>(
    queueName,
    async (job) => {
      if (job.name !== WORKFLOW_JOB_NAME) return
      await processWorkflowJob(job)
    },
    {
      connection: getRedis(),
      concurrency: Number(process.env.WORKER_CONCURRENCY || 4),
    },
  )

  worker.on('completed', (job) => {
    console.log(`[worker] completed job ${job.id}`)
  })
  worker.on('failed', (job, err) => {
    console.error(`[worker] failed job ${job?.id}:`, err.message)
  })

  console.log(`[worker] listening on queue "${queueName}"`)
  started = worker
  return worker
}

async function main() {
  await connectMongo()
  startWorker()
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[worker] failed to start', err)
    process.exit(1)
  })
}
