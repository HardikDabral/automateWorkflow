/**
 * Resolve `{{path.to.value}}` placeholders in a config object from a context.
 * Non-string values are returned unchanged. Nested objects/arrays are walked.
 */

const PLACEHOLDER_RE = /\{\{\s*([^}]+?)\s*\}\}/g

export function resolveVariables<T>(input: T, context: Record<string, unknown>): T {
  if (typeof input === 'string') {
    return resolveString(input, context) as T
  }
  if (Array.isArray(input)) {
    return input.map((item) => resolveVariables(item, context)) as T
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
      out[k] = resolveVariables(v, context)
    }
    return out as T
  }
  return input
}

function resolveString(template: string, context: Record<string, unknown>): string {
  // If the template is a single placeholder and the resolved value is a non-string,
  // return the raw value (e.g. a number or object passed through).
  const soleMatch = template.match(/^\{\{\s*([^}]+?)\s*\}\}$/)
  if (soleMatch) {
    const value = lookup(soleMatch[1], context)
    if (value == null) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }
  return template.replace(PLACEHOLDER_RE, (_m, path) => {
    const value = lookup(path, context)
    if (value == null) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  })
}

function lookup(path: string, context: Record<string, unknown>): unknown {
  const segments = path.split('.').map((s) => s.trim()).filter(Boolean)
  let current: unknown = context
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}
