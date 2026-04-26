'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WorkflowDefinition } from '@wf/shared'
import { api } from '@/lib/api'

interface StartResponse {
  sessionId: string
}

interface MessageResponse {
  chatText: string
  workflowDraft: WorkflowDefinition | null
}

export function useStartAiSession() {
  return useMutation({
    mutationFn: async () => (await api.post<StartResponse>('/api/ai/session/start')).data,
  })
}

export function useSendAiMessage(sessionId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { message: string; currentWorkflow?: WorkflowDefinition }) => {
      if (!sessionId) throw new Error('No active AI session')
      const { data } = await api.post<MessageResponse>(
        `/api/ai/session/${sessionId}/message`,
        body,
      )
      return data
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['usage'] }),
  })
}

export function useDeleteAiSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/api/ai/session/${sessionId}`)
    },
  })
}
