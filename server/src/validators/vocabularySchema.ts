import { z } from 'zod'

const ConnectedIntegrationSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.any()).default({}),
})

const EmailTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
  variables: z.array(z.string()).default([]),
})

export const UpdateVocabularySchema = z.object({
  pipelineStages: z.array(z.string()).optional(),
  customFields: z
    .object({
      contact: z.array(z.string()).optional(),
      company: z.array(z.string()).optional(),
      lead: z.array(z.string()).optional(),
    })
    .optional(),
  connectedIntegrations: z.array(ConnectedIntegrationSchema).optional(),
  emailTemplates: z.array(EmailTemplateSchema).optional(),
  entityEvents: z.array(z.string()).optional(),
})

export type UpdateVocabularyInput = z.infer<typeof UpdateVocabularySchema>
