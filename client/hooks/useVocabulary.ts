'use client'

import { useQuery } from '@tanstack/react-query'
import type { CustomerVocabulary } from '@wf/shared'
import { api } from '@/lib/api'

export function useVocabulary() {
  return useQuery<CustomerVocabulary>({
    queryKey: ['vocabulary'],
    queryFn: async () => (await api.get<CustomerVocabulary>('/api/vocabulary')).data,
    staleTime: 5 * 60_000,
  })
}
