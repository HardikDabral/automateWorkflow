import { Schema, Query, Document, CallbackWithoutResultAndOptionalError } from 'mongoose'
import { getTenantId } from '../context/tenantContext'

/**
 * Mongoose plugin that scopes every find* query and save() by the current
 * AsyncLocalStorage tenant context. Apply to every tenant-owned schema.
 *
 * Opt out per-query with `.setOptions({ skipTenantScope: true })` — required
 * during signup/login where the caller has no tenant context yet.
 */
export function tenantScopePlugin(schema: Schema): void {
  schema.pre(/^find/, function (this: Query<unknown, unknown>, next: CallbackWithoutResultAndOptionalError) {
    const opts = this.getOptions() as { skipTenantScope?: boolean }
    if (opts.skipTenantScope) return next()

    const query = this.getQuery() as { tenantId?: unknown }
    if (query.tenantId !== undefined) return next()

    const tenantId = getTenantId()
    if (!tenantId) {
      return next(new Error(`tenantScope: no tenant context for ${this.model?.modelName ?? 'query'}`))
    }
    this.where({ tenantId })
    next()
  })

  schema.pre('countDocuments', function (this: Query<unknown, unknown>, next: CallbackWithoutResultAndOptionalError) {
    const opts = this.getOptions() as { skipTenantScope?: boolean }
    if (opts.skipTenantScope) return next()

    const query = this.getQuery() as { tenantId?: unknown }
    if (query.tenantId !== undefined) return next()

    const tenantId = getTenantId()
    if (!tenantId) {
      return next(new Error(`tenantScope: no tenant context for ${this.model?.modelName ?? 'count'}`))
    }
    this.where({ tenantId })
    next()
  })

  // NOTE: must be pre('validate'), not pre('save'). Mongoose runs validation
  // before save hooks, so assigning tenantId in pre('save') would be too late
  // and required-field validation would fail.
  schema.pre('validate', function (this: Document & { tenantId?: unknown }, next: CallbackWithoutResultAndOptionalError) {
    if (this.isNew && this.tenantId === undefined) {
      const tenantId = getTenantId()
      if (tenantId) this.tenantId = tenantId
    }
    next()
  })
}
