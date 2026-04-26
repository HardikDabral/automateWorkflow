import type { Request, Response } from 'express'
import { SendMessageSchema } from '../validators/aiSchema'
import * as aiService from '../services/aiService'

type SessionParams = { id: string }

export async function startSession(_req: Request, res: Response) {
  res.status(201).json(await aiService.startSession())
}

export async function sendMessage(req: Request<SessionParams>, res: Response) {
  const input = SendMessageSchema.parse(req.body)
  res.json(await aiService.sendMessage(req.params.id, input.message, input.currentWorkflow))
}

export async function deleteSession(req: Request<SessionParams>, res: Response) {
  await aiService.deleteSession(req.params.id)
  res.status(204).end()
}
