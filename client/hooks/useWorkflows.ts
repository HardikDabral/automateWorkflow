'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Workflow, WorkflowVersion, WorkflowDefinition } from '@wf/shared'
import { api } from '@/lib/api'

export function useWorkflowsList() {
  return useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => (await api.get<Workflow[]>('/api/workflows')).data,
  })
}

export function useWorkflow(id: string | null) {
  return useQuery<Workflow & { activeVersionId?: WorkflowVersion }>({
    queryKey: ['workflow', id],
    queryFn: async () => (await api.get(`/api/workflows/${id}`)).data,
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await api.post<Workflow>('/api/workflows', input)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

interface CreateVersionBody {
  definition: WorkflowDefinition
  authoredVia?: 'ai_chat' | 'visual_builder'
  aiSessionId?: string
}

export function useCreateVersion(workflowId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateVersionBody) => {
      const { data } = await api.post<WorkflowVersion>(
        `/api/workflows/${workflowId}/versions`,
        body,
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow', workflowId] })
    },
  })
}

export interface ActivatePreview {
  affectedCount: number
  requiresConfirm: boolean
  entityType: string | null
}

export function useActivatePreview(workflowId: string | null, enabled: boolean) {
  return useQuery<ActivatePreview>({
    queryKey: ['workflow-activate-preview', workflowId],
    queryFn: async () =>
      (await api.get(`/api/workflows/${workflowId}/activate-preview`)).data,
    enabled: !!workflowId && enabled,
  })
}

export function useActivateWorkflow(workflowId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { activateFrom: 'future_only' | 'all' }) => {
      const { data } = await api.post<Workflow>(`/api/workflows/${workflowId}/activate`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow', workflowId] })
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useTestRunWorkflow(workflowId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (triggerPayload: Record<string, unknown> = {}) => {
      const { data } = await api.post<{ _id: string }>(
        `/api/workflows/${workflowId}/test-run`,
        { triggerPayload },
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow-runs', workflowId] })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['usage'] }),
  })
}

export function usePauseWorkflow(workflowId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Workflow>(`/api/workflows/${workflowId}/pause`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow', workflowId] })
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}
