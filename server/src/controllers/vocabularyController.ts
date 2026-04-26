import type { Request, Response } from 'express'
import { UpdateVocabularySchema } from '../validators/vocabularySchema'
import * as vocabService from '../services/vocabularyService'

export async function getVocabulary(_req: Request, res: Response) {
  res.json(await vocabService.getVocabulary())
}

export async function updateVocabulary(req: Request, res: Response) {
  const input = UpdateVocabularySchema.parse(req.body)
  res.json(await vocabService.updateVocabulary(input))
}
