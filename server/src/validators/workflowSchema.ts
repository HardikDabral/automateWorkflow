import { z } from 'zod'
import { WorkflowDefinitionSchema } from '@wf/shared'

export { WorkflowDefinitionSchema }

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

export const CreateVersionSchema = z.object({
  definition: WorkflowDefinitionSchema,
  authoredVia: z.enum(['ai_chat', 'visual_builder']).default('visual_builder'),
  aiSessionId: z.string().optional(),
})

export const ActivateSchema = z.object({
  activateFrom: z.enum(['future_only', 'all']).default('future_only'),
})

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>
export type CreateVersionInput = z.infer<typeof CreateVersionSchema>
export type ActivateInput = z.infer<typeof ActivateSchema>
