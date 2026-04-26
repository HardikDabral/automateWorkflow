import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { tenantStorage, type RequestContext } from '../context/tenantContext'

declare global {
  namespace Express {
    interface Request {
      user?: RequestContext
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' })
    return
  }
  const token = header.slice('Bearer '.length)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'JWT not configured' })
    return
  }

  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(token, secret) as jwt.JwtPayload
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const { userId, tenantId, role } = decoded as {
    userId?: string
    tenantId?: string
    role?: 'admin' | 'member'
  }
  if (!userId || !tenantId || !role) {
    res.status(401).json({ error: 'Malformed token payload' })
    return
  }

  const ctx: RequestContext = { userId, tenantId, role }
  req.user = ctx
  // Run the rest of the request chain inside the ALS context so Mongoose
  // hooks and services can reach tenantId without passing it explicitly.
  tenantStorage.run(ctx, () => next())
}
