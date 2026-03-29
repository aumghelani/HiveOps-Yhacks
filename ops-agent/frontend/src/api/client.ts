/**
 * HiveOps API client — all functions hit the real backend.
 * Vite proxies /api to localhost:8000.
 */
import axios from 'axios'
import type {
  Incident, SubTicket, AgentLog, EvidencePackage, ApprovalDecision,
} from '@/types'

// In dev: Vite proxies /api to localhost:8000
// In prod: VITE_API_URL env var points to the deployed backend
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Log requests in dev
http.interceptors.request.use(req => {
  console.debug(`[api] ${req.method?.toUpperCase()} ${req.url}`)
  return req
})

export const api = {
  incidents: {
    list: async (): Promise<Incident[]> => {
      const { data } = await http.get('/incidents/')
      return data
    },

    get: async (id: string): Promise<Incident> => {
      const { data } = await http.get(`/incidents/${id}`)
      return data
    },

    update: async (id: string, payload: Partial<Incident>): Promise<Incident> => {
      const { data } = await http.patch(`/incidents/${id}`, payload)
      return data
    },

    // Trigger via webhook — creates an incident and runs pipeline
    triggerDemo: async (): Promise<{ incident_id: string }> => {
      const { data } = await http.post('/incidents/webhook', {
        title: 'Payment service error rate spike',
        service: 'payment-service',
        severity: 'P1',
        description: 'Checkout endpoint returning HTTP 500 since 14:22. Error rate 34%. Deployment v2.3.1 pushed at 14:05.',
        source: 'demo',
      })
      return data
    },

    getSubTickets: async (id: string): Promise<SubTicket[]> => {
      const { data } = await http.get(`/incidents/${id}/sub-tickets`)
      return data
    },

    getEvidence: async (id: string): Promise<EvidencePackage> => {
      const { data } = await http.get(`/incidents/${id}/evidence`)
      return data
    },

    getLogs: async (id: string): Promise<AgentLog[]> => {
      const { data } = await http.get(`/incidents/${id}/logs`)
      return data
    },
  },

  approvals: {
    getPending: async (): Promise<Incident[]> => {
      const { data } = await http.get('/approvals/pending')
      return data
    },

    submitDecision: async (
      incidentId: string,
      decision: ApprovalDecision,
      notes?: string,
    ): Promise<{ approval_id: string; decision: string; new_status: string }> => {
      const { data } = await http.post(`/approvals/${incidentId}/decide`, {
        incident_id: incidentId,
        decision,
        notes: notes || null,
        reviewer_id: 'demo-reviewer',
      })
      return data
    },

    getHistory: async (): Promise<unknown[]> => {
      const { data } = await http.get('/approvals/history')
      return data
    },
  },

  chat: {
    send: async (message: string, incidentId?: string, history: { role: string; content: string }[] = []): Promise<{ reply: string; context_used: boolean }> => {
      const { data } = await http.post('/chat/', {
        message,
        incident_id: incidentId || null,
        conversation_history: history,
      })
      return data
    },
  },
}

export default api
