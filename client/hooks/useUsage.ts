'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Usage {
  plan: 'trial' | 'pro' | 'enterprise'
  aiCallsUsed: number
  aiCallLimit: number
  testRunsUsed: number
  testRunLimit: number
}

export function useUsage() {
  return useQuery<Usage>({
    queryKey: ['usage'],
    queryFn: async () => {
      const { data } = await api.get<Usage>('/api/me/usage')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}
