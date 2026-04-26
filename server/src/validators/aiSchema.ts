import { z } from 'zod'
import { WorkflowDefinitionSchema } from '@wf/shared'

export const SendMessageSchema = z.object({
  message: z.string().min(1).max(8000),
  currentWorkflow: WorkflowDefinitionSchema.optional(),
})

export type SendMessageInput = z.infer<typeof SendMessageSchema>
