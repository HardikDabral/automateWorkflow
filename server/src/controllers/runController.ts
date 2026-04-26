import type { Request, Response } from 'express'
import * as runService from '../services/runService'

type IdParams = { id: string }
type RunParams = { runId: string }

export async function listForWorkflow(req: Request<IdParams>, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 20), 100)
  const skip = Math.max(Number(req.query.skip ?? 0), 0)
  res.json(await runService.listRunsForWorkflow(req.params.id, limit, skip))
}

export async function get(req: Request<RunParams>, res: Response) {
  res.json(await runService.getRun(req.params.runId))
}

export async function cancel(req: Request<RunParams>, res: Response) {
  res.json(await runService.cancelRun(req.params.runId))
}
