import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Tenant, User, CustomerVocabulary } from '../models'
import { DEFAULT_ENTITY_EVENTS } from '@wf/shared'
import type { SignupInput, LoginInput } from '../validators/authSchema'

export interface TokenPair {
  token: string
  refreshToken: string
}

function signTokens(payload: { userId: string; tenantId: string; role: 'admin' | 'member' }): TokenPair {
  const secret = process.env.JWT_SECRET
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  if (!secret || !refreshSecret) throw new Error('JWT secrets not configured')
  const token = jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions)
  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
  return { token, refreshToken }
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'tenant'}-${Math.random().toString(36).slice(2, 8)}`
}

export async function signup(input: SignupInput) {
  // Reject if email already exists on any tenant. Cross-tenant scan uses skipTenantScope.
  const existing = await User.findOne({ email: input.email.toLowerCase() })
    .setOptions({ skipTenantScope: true })
    .lean()
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 })

  const tenant = await Tenant.create({ name: input.companyName, slug: slugify(input.companyName) })

  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await User.create({
    tenantId: tenant._id,
    email: input.email.toLowerCase(),
    passwordHash,
    role: 'admin', // first user of a tenant is admin
  })

  await CustomerVocabulary.create({
    tenantId: tenant._id,
    entityEvents: [...DEFAULT_ENTITY_EVENTS],
  })

  const tokens = signTokens({
    userId: user._id.toString(),
    tenantId: tenant._id.toString(),
    role: user.role,
  })

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      email: user.email,
      tenantId: tenant._id.toString(),
      role: user.role,
    },
  }
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() })
    .setOptions({ skipTenantScope: true })
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 })

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 })

  const tokens = signTokens({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
  })

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      email: user.email,
      tenantId: user.tenantId.toString(),
      role: user.role,
    },
  }
}

export function refresh(refreshToken: string) {
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  const secret = process.env.JWT_SECRET
  if (!refreshSecret || !secret) throw new Error('JWT secrets not configured')

  let decoded: jwt.JwtPayload
  try {
    decoded = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 })
  }
  const { userId, tenantId, role } = decoded as {
    userId: string
    tenantId: string
    role: 'admin' | 'member'
  }
  if (!userId || !tenantId || !role) {
    throw Object.assign(new Error('Malformed refresh token'), { status: 401 })
  }
  const token = jwt.sign({ userId, tenantId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions)
  return { token }
}
