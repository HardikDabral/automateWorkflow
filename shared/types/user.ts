export type UserRole = 'admin' | 'member'
export type TenantPlan = 'trial' | 'pro' | 'enterprise'

export interface Tenant {
  _id: string
  name: string
  slug: string
  plan: TenantPlan
  timezone: string
  createdAt: string
}

export interface User {
  _id: string
  tenantId: string
  email: string
  role: UserRole
  timezone?: string
  createdAt: string
}

export interface AuthContext {
  userId: string
  tenantId: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    tenantId: string
    role: UserRole
  }
}
