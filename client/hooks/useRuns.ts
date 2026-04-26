'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RunEvent, RunStep, WorkflowRun } from '@wf/shared'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface RunListResponse {
  items: WorkflowRun[]
  total: number
  limit: number
  skip: number
}

export function useWorkflowRuns(workflowId: string | null, limit = 20) {
  return useQuery<RunListResponse>({
    queryKey: ['workflow-runs', workflowId, limit],
    queryFn: async () =>
      (await api.get(`/api/workflows/${workflowId}/runs`, { params: { limit } })).data,
    enabled: !!workflowId,
    refetchInterval: 5000,
  })
}

export function useRun(runId: string | null) {
  return useQuery<{ run: WorkflowRun; steps: RunStep[] }>({
    queryKey: ['run', runId],
    queryFn: async () => (await api.get(`/api/runs/${runId}`)).data,
    enabled: !!runId,
  })
}

export function useCancelRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (runId: string) => {
      const { data } = await api.post<WorkflowRun>(`/api/runs/${runId}/cancel`)
      return data
    },
    onSuccess: (_, runId) => {
      qc.invalidateQueries({ queryKey: ['run', runId] })
      qc.invalidateQueries({ queryKey: ['workflow-runs'] })
    },
  })
}

/** Attach a socket listener that refreshes the relevant run query on events. */
export function useLiveRunEvents(runId: string | null) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!runId) return
    const socket = getSocket()

    const handleRun = (evt: RunEvent) => {
      if (evt.runId !== runId) return
      qc.invalidateQueries({ queryKey: ['run', runId] })
      qc.invalidateQueries({ queryKey: ['workflow-runs'] })
    }

    const handleStep = (evt: RunEvent) => {
      if (evt.runId !== runId) return
      qc.invalidateQueries({ queryKey: ['run', runId] })
    }

    socket.on('run:started', handleRun)
    socket.on('run:completed', handleRun)
    socket.on('step:completed', handleStep)

    return () => {
      socket.off('run:started', handleRun)
      socket.off('run:completed', handleRun)
      socket.off('step:completed', handleStep)
    }
  }, [runId, qc])
}

/** Dashboard-level listener: invalidates the full list on any run event. */
export function useLiveWorkflowListEvents(workflowId: string | null) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!workflowId) return
    const socket = getSocket()
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['workflow-runs', workflowId] })
    }
    socket.on('run:started', refresh)
    socket.on('run:completed', refresh)
    return () => {
      socket.off('run:started', refresh)
      socket.off('run:completed', refresh)
    }
  }, [workflowId, qc])
}
