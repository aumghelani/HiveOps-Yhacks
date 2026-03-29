import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

// Stop polling when query is in error state — prevents log spam when backend is down
function pollingInterval(ms: number) {
  return (query: { state: { status: string } }) =>
    query.state.status === 'error' ? false : ms
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.incidents.list(),
    refetchInterval: pollingInterval(5000),
    staleTime: 2000,
    retry: 1,
  })
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.incidents.get(id!),
    enabled: !!id,
    refetchInterval: pollingInterval(3000),
    staleTime: 1000,
    retry: 1,
  })
}

export function useSubTickets(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['sub_tickets', incidentId],
    queryFn: () => api.incidents.getSubTickets(incidentId!),
    enabled: !!incidentId,
    refetchInterval: pollingInterval(2000),
    staleTime: 1000,
    retry: 1,
  })
}

export function useAgentLogs(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['agent_logs', incidentId],
    queryFn: () => api.incidents.getLogs(incidentId!),
    enabled: !!incidentId,
    refetchInterval: pollingInterval(4000),
    retry: 1,
  })
}

export function useEvidence(incidentId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['evidence', incidentId],
    queryFn: () => api.incidents.getEvidence(incidentId!),
    enabled: !!incidentId && enabled,
    staleTime: 10000,
    retry: 1,
  })
}

export function useTriggerDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.incidents.triggerDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}
