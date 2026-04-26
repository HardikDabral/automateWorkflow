import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

interface HttpError extends Error {
  status?: number
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.issues })
    return
  }

  const e = err as HttpError
  const status = typeof e?.status === 'number' ? e.status : 500
  const message = e?.message || 'Internal server error'

  if (status >= 500) {
    console.error('[error]', err)
  }
  res.status(status).json({ error: message })
}
