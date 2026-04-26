import type { Request, Response } from 'express'
import { SignupSchema, LoginSchema, RefreshSchema } from '../validators/authSchema'
import * as authService from '../services/authService'

export async function signup(req: Request, res: Response) {
  const input = SignupSchema.parse(req.body)
  const result = await authService.signup(input)
  res.status(201).json(result)
}

export async function login(req: Request, res: Response) {
  const input = LoginSchema.parse(req.body)
  const result = await authService.login(input)
  res.json(result)
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = RefreshSchema.parse(req.body)
  const result = authService.refresh(refreshToken)
  res.json(result)
}
