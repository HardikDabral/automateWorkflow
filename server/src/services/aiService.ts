import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { WorkflowDefinitionSchema, type WorkflowDefinition, type CustomerVocabulary } from '@wf/shared'
import { cacheGet, cacheSet, cacheDel, sessionCacheKey } from './redisService'
import { getVocabulary } from './vocabularyService'
import { consumeAiCall } from './quotaService'
import { requireTenantId } from '../context/tenantContext'

const SESSION_TTL_SECONDS = 7200 // 2 hours, per spec

type Role = 'user' | 'assistant'

export interface AiMessage {
  role: Role
  content: string
}

export interface AiSession {
  sessionId: string
  tenantId: string
  systemPrompt: string
  history: AiMessage[]
  workflowDraft: WorkflowDefinition | null
}

let client: OpenAI | null = null
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not set')
    client = new OpenAI({
      apiKey,
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    })
  }
  return client
}

// ── session lifecycle ────────────────────────────────────────────────────

export async function startSession(): Promise<{ sessionId: string }> {
  const tenantId = requireTenantId()
  const vocab = await getVocabulary()
  const systemPrompt = buildSystemPrompt(vocab)
  const sessionId = uuidv4()
  const session: AiSession = {
    sessionId,
    tenantId,
    systemPrompt,
    history: [],
    workflowDraft: null,
  }
  await cacheSet(sessionCacheKey(sessionId), session, SESSION_TTL_SECONDS)
  return { sessionId }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const session = await loadSession(sessionId)
  // loadSession validates tenant match; if we got here, it's ours to delete.
  await cacheDel(sessionCacheKey(session.sessionId))
}

export interface SendMessageResult {
  chatText: string
  workflowDraft: WorkflowDefinition | null
}

export async function sendMessage(
  sessionId: string,
  userMessage: string,
  currentWorkflow?: WorkflowDefinition,
): Promise<SendMessageResult> {
  const session = await loadSession(sessionId)

  // Gate before any LLM call so a 402 doesn't leave a half-billed token spend.
  await consumeAiCall()

  // If the caller sent the latest canvas state, nudge the model with it
  // so edits operate on the user's current draft, not on stale model memory.
  const messageWithContext = currentWorkflow
    ? `${userMessage}\n\nCurrent workflow JSON (for context):\n\`\`\`workflow-json\n${JSON.stringify(currentWorkflow, null, 2)}\n\`\`\``
    : userMessage

  const history: AiMessage[] = [...session.history, { role: 'user', content: messageWithContext }]
  const { text, workflowDraft } = await callClaudeWithRetry(session.systemPrompt, history)

  const newHistory: AiMessage[] = [
    ...session.history,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: text },
  ]
  const updated: AiSession = {
    ...session,
    history: newHistory,
    workflowDraft: workflowDraft ?? session.workflowDraft,
  }
  await cacheSet(sessionCacheKey(sessionId), updated, SESSION_TTL_SECONDS)

  return { chatText: stripWorkflowJson(text), workflowDraft: workflowDraft ?? null }
}

// ── internals ────────────────────────────────────────────────────────────

async function loadSession(sessionId: string): Promise<AiSession> {
  const session = await cacheGet<AiSession>(sessionCacheKey(sessionId))
  if (!session) {
    throw Object.assign(new Error('Session not found or expired'), { status: 404 })
  }
  const tenantId = requireTenantId()
  if (session.tenantId !== tenantId) {
    throw Object.assign(new Error('Session not found or expired'), { status: 404 })
  }
  return session
}

async function callClaudeWithRetry(
  systemPrompt: string,
  history: AiMessage[],
): Promise<{ text: string; workflowDraft: WorkflowDefinition | null }> {
  const first = await callClaude(systemPrompt, history)
  const extracted = extractWorkflowJson(first)
  if (!extracted) {
    // No JSON block — perfectly valid for a conversational reply. No retry needed.
    return { text: first, workflowDraft: null }
  }
  const parsed = safeParseDefinition(extracted)
  if (parsed.success) {
    return { text: first, workflowDraft: parsed.data }
  }

  // Single corrective retry — give the model its own output + the Zod errors.
  const issues = parsed.error.issues
    .slice(0, 10)
    .map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  const retryHistory: AiMessage[] = [
    ...history,
    { role: 'assistant', content: first },
    {
      role: 'user',
      content:
        'The workflow-json block you produced failed schema validation. Please return a corrected workflow JSON (complete, not a diff) fixing these issues:\n' +
        issues,
    },
  ]
  const second = await callClaude(systemPrompt, retryHistory)
  const extractedSecond = extractWorkflowJson(second)
  if (!extractedSecond) return { text: second, workflowDraft: null }
  const parsedSecond = safeParseDefinition(extractedSecond)
  if (parsedSecond.success) return { text: second, workflowDraft: parsedSecond.data }

  // Even the retry failed — surface the conversational text so the user sees
  // the model's explanation, but don't overwrite their canvas with junk.
  return { text: second, workflowDraft: null }
}

async function callClaude(systemPrompt: string, history: AiMessage[]): Promise<string> {
  const llm = getClient()
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

  const response = await llm.chat.completions.create({
    model,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  })

  return response.choices[0]?.message?.content ?? ''
}

// Match fenced ```workflow-json ... ``` blocks. DOTALL via [\s\S].
const WORKFLOW_JSON_RE = /```workflow-json\s*([\s\S]*?)```/

export function extractWorkflowJson(text: string): unknown | null {
  const match = text.match(WORKFLOW_JSON_RE)
  if (!match) return null
  const raw = match[1].trim()
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function stripWorkflowJson(text: string): string {
  return text.replace(WORKFLOW_JSON_RE, '').trim()
}

function safeParseDefinition(data: unknown): z.SafeParseReturnType<unknown, WorkflowDefinition> {
  return WorkflowDefinitionSchema.safeParse(data)
}

// ── system prompt ────────────────────────────────────────────────────────

function buildSystemPrompt(vocab: CustomerVocabulary): string {
  const lines: string[] = []
  lines.push('You are a workflow automation assistant. You help users build automated workflows.')
  lines.push('')
  lines.push('Available step types:')
  lines.push('- delay: wait for N days/hours. Config: { duration_days?, duration_hours? }')
  lines.push('- send_email: send an email. Config: { to, subject, templateId?, body? }')
  lines.push('- slack: post to Slack. Config: { channel, message }')
  lines.push('- http: make an HTTP call. Config: { method, url, headers?, body? }')
  lines.push('- branch: conditional logic. Config: { field, operator, value }. Has yesBranch and noBranch arrays.')
  lines.push('- loop: iterate over a collection. Config: { collection }. Has loopSteps array.')
  lines.push('- create_record: create a record. Config: { entityType, fields: {} }')
  lines.push('- update_record: update a record. Config: { entityType, entityId, fields: {} }')
  lines.push('')
  lines.push('Available trigger types:')
  lines.push(
    `- event: fires when a domain event occurs. event field must be one of: ${formatList(vocab.entityEvents)}`,
  )
  lines.push('- schedule: cron-based. cron field is a valid cron string.')
  lines.push('')
  lines.push("This tenant's vocabulary:")
  lines.push(`- Pipeline stages: ${formatList(vocab.pipelineStages)}`)
  lines.push(`- Custom fields on lead: ${formatList(vocab.customFields.lead)}`)
  lines.push(`- Custom fields on contact: ${formatList(vocab.customFields.contact)}`)
  lines.push(`- Custom fields on company: ${formatList(vocab.customFields.company)}`)
  lines.push(`- Connected integrations: ${formatList(vocab.connectedIntegrations.map((i) => i.type))}`)
  lines.push(
    `- Email templates: ${formatList(vocab.emailTemplates.map((t) => `${t.id} (${t.name})`))}`,
  )
  lines.push('')
  lines.push(
    'When the user describes a workflow, respond conversationally AND include a JSON block wrapped in triple backticks with the language tag "workflow-json". The JSON must match the WorkflowDefinition schema exactly. Variable placeholders use double curly braces: {{entity.fieldName}}.',
  )
  lines.push('')
  lines.push(
    'If the user asks to modify the workflow, return the complete updated workflow JSON, not just the changed parts.',
  )
  return lines.join('\n')
}

function formatList(items: readonly string[]): string {
  return items.length ? items.join(', ') : '(none yet)'
}
