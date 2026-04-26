import type { Request, Response } from 'express'
import {
  CreateWorkflowSchema,
  CreateVersionSchema,
  ActivateSchema,
} from '../validators/workflowSchema'
import * as workflowService from '../services/workflowService'

type IdParams = { id: string }

export async function list(_req: Request, res: Response) {
  res.json(await workflowService.listWorkflows())
}

export async function create(req: Request, res: Response) {
  const input = CreateWorkflowSchema.parse(req.body)
  res.status(201).json(await workflowService.createWorkflow(input))
}

export async function get(req: Request<IdParams>, res: Response) {
  res.json(await workflowService.getWorkflow(req.params.id))
}

export async function createVersion(req: Request<IdParams>, res: Response) {
  const input = CreateVersionSchema.parse(req.body)
  res.status(201).json(await workflowService.createVersion(req.params.id, input))
}

export async function activatePreview(req: Request<IdParams>, res: Response) {
  res.json(await workflowService.activatePreview(req.params.id))
}

export async function activate(req: Request<IdParams>, res: Response) {
  const input = ActivateSchema.parse(req.body ?? {})
  res.json(await workflowService.activateWorkflow(req.params.id, input))
}

export async function pause(req: Request<IdParams>, res: Response) {
  res.json(await workflowService.pauseWorkflow(req.params.id))
}

export async function testRun(req: Request<IdParams>, res: Response) {
  const payload = (req.body?.triggerPayload ?? {}) as Record<string, unknown>
  res.status(201).json(await workflowService.testRunWorkflow(req.params.id, payload))
}
