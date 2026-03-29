// WebSocket for live incident updates — falls back to React Query polling if WS fails
import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useIncidentWebSocket(incidentId: string | undefined) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const failedRef = useRef(false)

  const connect = useCallback(() => {
    if (!incidentId || failedRef.current) return

    // In dev: localhost. In prod: use VITE_API_URL (swap http→ws)
    const base = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
      : 'ws://localhost:8000'
    const ws = new WebSocket(`${base}/ws/incidents/${incidentId}`)
    wsRef.current = ws

    ws.onopen = () => console.debug(`[ws] connected incident=${incidentId}`)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.sub_tickets) {
          queryClient.setQueryData(['sub_tickets', incidentId], msg.sub_tickets)
        }
        if (msg.incident) {
          queryClient.setQueryData(['incident', incidentId], msg.incident)
        }
      } catch { /* ignore malformed */ }
    }

    ws.onerror = () => {
      console.debug('[ws] error — falling back to polling')
      failedRef.current = true
    }

    ws.onclose = () => console.debug(`[ws] closed incident=${incidentId}`)
  }, [incidentId, queryClient])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])
}
