// Zustand store — UI-only state. Data fetching is in React Query hooks.
import { create } from 'zustand'

interface IncidentStore {
  selectedIncidentId: string | null
  selectIncident: (id: string | null) => void

  showCelebration: boolean
  triggerCelebration: () => void
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  selectedIncidentId: null,
  selectIncident: (id) => set({ selectedIncidentId: id }),

  showCelebration: false,
  triggerCelebration: () => {
    set({ showCelebration: true })
    setTimeout(() => set({ showCelebration: false }), 4000)
  },
}))
