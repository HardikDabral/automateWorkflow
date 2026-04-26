import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestContext {
  tenantId: string
  userId: string
  role: 'admin' | 'member'
}

export const tenantStorage = new AsyncLocalStorage<RequestContext>()

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return tenantStorage.run(ctx, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return tenantStorage.getStore()
}

export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId
}

export function requireTenantId(): string {
  const id = getTenantId()
  if (!id) {
    throw new Error('Tenant context missing — call must run inside runWithContext()')
  }
  return id
}
