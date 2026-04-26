export interface ConnectedIntegration {
  type: string
  config: Record<string, unknown>
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  variables: string[]
}

export interface CustomerVocabulary {
  _id: string
  tenantId: string
  pipelineStages: string[]
  customFields: {
    contact: string[]
    company: string[]
    lead: string[]
  }
  connectedIntegrations: ConnectedIntegration[]
  emailTemplates: EmailTemplate[]
  entityEvents: string[]
  updatedAt: string
}

export const DEFAULT_ENTITY_EVENTS = [
  'lead.created',
  'contact.stage.changed',
  'meeting.analyzed',
  'deal.closed',
] as const
