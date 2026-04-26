import type { Step } from '@wf/shared'
import type { StepContext } from './types'
import { resolveVariables } from '../variableResolver'

interface BranchConfig {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'exists'
  value?: unknown
}

export interface BranchEvaluation {
  branchTaken: 'yes' | 'no'
  conditionEvaluation: {
    field: string
    operator: string
    expected: unknown
    actual: unknown
  }
}

/**
 * Evaluate a branch condition. Per spec note #7, branches resolve against the
 * LIVE entity state from Mongo, not the trigger snapshot.
 */
export async function evaluateBranch(step: Step, ctx: StepContext): Promise<BranchEvaluation> {
  const config = step.config as unknown as BranchConfig
  if (!config?.field || !config?.operator) {
    throw new Error('branch: missing field or operator')
  }

  const live = (await ctx.getLiveEntity()) ?? {}
  const actual = lookupPath(config.field, live)
  // Variable resolution on the *expected* side, using the live entity so
  // e.g. `{{contact.stageBefore}}` works inside conditions.
  const expected = resolveVariables(config.value, live as Record<string, unknown>)

  const taken = compare(actual, config.operator, expected) ? 'yes' : 'no'
  return {
    branchTaken: taken,
    conditionEvaluation: { field: config.field, operator: config.operator, expected, actual },
  }
}

function compare(actual: unknown, op: BranchConfig['operator'], expected: unknown): boolean {
  switch (op) {
    case 'eq':
      return actual === expected
    case 'ne':
      return actual !== expected
    case 'gt':
      return Number(actual) > Number(expected)
    case 'gte':
      return Number(actual) >= Number(expected)
    case 'lt':
      return Number(actual) < Number(expected)
    case 'lte':
      return Number(actual) <= Number(expected)
    case 'contains':
      if (typeof actual === 'string') return actual.includes(String(expected))
      if (Array.isArray(actual)) return actual.includes(expected)
      return false
    case 'in':
      return Array.isArray(expected) && expected.includes(actual as never)
    case 'exists':
      return actual !== undefined && actual !== null
    default:
      return false
  }
}

function lookupPath(path: string, obj: Record<string, unknown>): unknown {
  const segments = path.split('.').filter(Boolean)
  let current: unknown = obj
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}
