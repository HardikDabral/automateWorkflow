import { CustomerVocabulary } from '../models'
import { cacheGet, cacheSet, cacheDel, vocabCacheKey } from './redisService'
import { DEFAULT_ENTITY_EVENTS, type CustomerVocabulary as VocabularyDTO } from '@wf/shared'
import { requireTenantId } from '../context/tenantContext'
import type { UpdateVocabularyInput } from '../validators/vocabularySchema'

const CACHE_TTL_SECONDS = 300 // 5 minutes

export async function getVocabulary(): Promise<VocabularyDTO> {
  const tenantId = requireTenantId()
  const key = vocabCacheKey(tenantId)

  const cached = await cacheGet<VocabularyDTO>(key)
  if (cached) return cached

  let doc = await CustomerVocabulary.findOne({ tenantId })
  if (!doc) {
    // Auto-heal: create the default doc if missing (e.g. existing tenant predates the seed).
    doc = await CustomerVocabulary.create({
      tenantId,
      entityEvents: [...DEFAULT_ENTITY_EVENTS],
    })
  }

  const dto = toDto(doc)
  await cacheSet(key, dto, CACHE_TTL_SECONDS)
  return dto
}

export async function updateVocabulary(input: UpdateVocabularyInput): Promise<VocabularyDTO> {
  const tenantId = requireTenantId()

  const doc = await CustomerVocabulary.findOneAndUpdate(
    { tenantId },
    { $set: input },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  if (!doc) throw new Error('Vocabulary upsert failed')

  await cacheDel(vocabCacheKey(tenantId))
  return toDto(doc)
}

function toDto(doc: any): VocabularyDTO {
  return {
    _id: String(doc._id),
    tenantId: String(doc.tenantId),
    pipelineStages: doc.pipelineStages ?? [],
    customFields: {
      contact: doc.customFields?.contact ?? [],
      company: doc.customFields?.company ?? [],
      lead: doc.customFields?.lead ?? [],
    },
    connectedIntegrations: (doc.connectedIntegrations ?? []).map((i: any) => ({
      type: i.type,
      config: i.config ?? {},
    })),
    emailTemplates: (doc.emailTemplates ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      html: t.html,
      variables: t.variables ?? [],
    })),
    entityEvents: doc.entityEvents ?? [],
    updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
  }
}
