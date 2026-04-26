import { z } from 'zod'

export const StepTypeEnum = z.enum([
  'delay',
  'send_email',
  'slack',
  'http',
  'branch',
  'loop',
  'create_record',
  'update_record',
])

export type StepType = z.infer<typeof StepTypeEnum>

export interface Step {
  id: string
  type: StepType
  config: Record<string, unknown>
  yesBranch?: Step[]
  noBranch?: Step[]
  loopSteps?: Step[]
}

export const StepSchema: z.ZodType<Step> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: StepTypeEnum,
    config: z.record(z.any()),
    yesBranch: z.array(StepSchema).optional(),
    noBranch: z.array(StepSchema).optional(),
    loopSteps: z.array(StepSchema).optional(),
  }),
)

export const TriggerSchema = z.object({
  type: z.enum(['event', 'schedule']),
  event: z.string().optional(),
  cron: z.string().optional(),
  timezone: z.string().optional(),
})

export const WorkflowDefinitionSchema = z.object({
  trigger: TriggerSchema,
  steps: z.array(StepSchema),
})

export type Trigger = z.infer<typeof TriggerSchema>
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>
