import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ApprovalDecision } from '@/types'

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: api.approvals.getPending,
    refetchInterval: (query) => query.state.status === 'error' ? false : 5000,
    retry: 1,
  })
}

export function useSubmitApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ incidentId, decision, notes }: {
      incidentId: string
      decision: ApprovalDecision
      notes?: string
    }) => api.approvals.submitDecision(incidentId, decision, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['incident'] })
    },
  })
}

export function useApprovalHistory() {
  return useQuery({
    queryKey: ['audit', 'approvals'],
    queryFn: api.approvals.getHistory,
    staleTime: 10000,
  })
}
