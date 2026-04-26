import { Schema, model, Document, Types } from 'mongoose'
import { tenantScopePlugin } from './tenantPlugin'
import { DEFAULT_ENTITY_EVENTS } from '@wf/shared'

export interface ConnectedIntegrationDoc {
  type: string
  config: Record<string, unknown>
}

export interface EmailTemplateDoc {
  id: string
  name: string
  subject: string
  html: string
  variables: string[]
}

export interface CustomerVocabularyDoc extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  pipelineStages: string[]
  customFields: {
    contact: string[]
    company: string[]
    lead: string[]
  }
  connectedIntegrations: ConnectedIntegrationDoc[]
  emailTemplates: EmailTemplateDoc[]
  entityEvents: string[]
  updatedAt: Date
}

const CustomerVocabularySchema = new Schema<CustomerVocabularyDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    pipelineStages: { type: [String], default: [] },
    customFields: {
      contact: { type: [String], default: [] },
      company: { type: [String], default: [] },
      lead: { type: [String], default: [] },
    },
    connectedIntegrations: {
      type: [
        new Schema<ConnectedIntegrationDoc>(
          { type: { type: String, required: true }, config: { type: Schema.Types.Mixed, default: {} } },
          { _id: false },
        ),
      ],
      default: [],
    },
    emailTemplates: {
      type: [
        new Schema<EmailTemplateDoc>(
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            subject: { type: String, required: true },
            html: { type: String, required: true },
            variables: { type: [String], default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    entityEvents: { type: [String], default: () => [...DEFAULT_ENTITY_EVENTS] },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
)

CustomerVocabularySchema.plugin(tenantScopePlugin)

export const CustomerVocabulary = model<CustomerVocabularyDoc>(
  'CustomerVocabulary',
  CustomerVocabularySchema,
)
