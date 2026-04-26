import { z } from 'zod'

export const SignupSchema = z.object({
  companyName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type SignupInput = z.infer<typeof SignupSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>
