import { Tenant } from '../models'
import { requireTenantId } from '../context/tenantContext'

export const AI_CALL_LIMIT = Number(process.env.AI_CALL_LIMIT || 10)
export const TEST_RUN_LIMIT = Number(process.env.TEST_RUN_LIMIT || 3)

export interface UsageSnapshot {
  plan: 'trial' | 'pro' | 'enterprise'
  aiCallsUsed: number
  aiCallLimit: number
  testRunsUsed: number
  testRunLimit: number
}

export async function getUsage(): Promise<UsageSnapshot> {
  const tenantId = requireTenantId()
  const t = await Tenant.findById(tenantId).lean()
  if (!t) throw Object.assign(new Error('Tenant not found'), { status: 404 })
  return {
    plan: t.plan,
    aiCallsUsed: t.aiCallsUsed ?? 0,
    aiCallLimit: AI_CALL_LIMIT,
    testRunsUsed: t.testRunsUsed ?? 0,
    testRunLimit: TEST_RUN_LIMIT,
  }
}

/**
 * Atomic check-and-increment. Returns the new used count if allowed,
 * or throws a 402 if the trial limit was already reached.
 * Pro/enterprise plans skip the gate entirely.
 */
export async function consumeAiCall(): Promise<number> {
  return consume('aiCallsUsed', AI_CALL_LIMIT, 'AI message')
}

export async function consumeTestRun(): Promise<number> {
  return consume('testRunsUsed', TEST_RUN_LIMIT, 'test run')
}

async function consume(
  field: 'aiCallsUsed' | 'testRunsUsed',
  limit: number,
  label: string,
): Promise<number> {
  const tenantId = requireTenantId()
  // Bypass for paid plans — only trial is gated.
  // findOneAndUpdate with $inc is atomic so two parallel requests can't both
  // sneak past the cap.
  const updated = await Tenant.findOneAndUpdate(
    {
      _id: tenantId,
      $or: [{ plan: { $ne: 'trial' } }, { [field]: { $lt: limit } }],
    },
    { $inc: { [field]: 1 } },
    { new: true },
  ).lean()

  if (!updated) {
    throw Object.assign(
      new Error(
        `Free trial limit reached for ${label}. This is a portfolio demo — contact the author to continue.`,
      ),
      { status: 402, code: 'QUOTA_EXCEEDED' },
    )
  }
  return (updated[field] as number) ?? 0
}
