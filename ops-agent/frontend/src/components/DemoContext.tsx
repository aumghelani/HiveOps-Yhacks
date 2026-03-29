// Demo mode state — controls simulated agent activity and phase for live demos
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DemoState {
  is_demo_mode: boolean
  active_agents: string[]
  currentPhase: number  // 0=idle, 1=investigating, 2=agents complete, 3=awaiting approval, 4=resolved
  showResolutionBanner: boolean
  showFlash: boolean
  advanceToPhase: (phase: number) => void
  toggle_demo: () => void
}

const DemoCtx = createContext<DemoState>({
  is_demo_mode: true,
  active_agents: ['triage', 'root_cause'],
  currentPhase: 1,
  showResolutionBanner: false,
  showFlash: false,
  advanceToPhase: () => {},
  toggle_demo: () => {},
})

export function useDemo() {
  return useContext(DemoCtx)
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [is_demo_mode, setDemo] = useState(true)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [showResolutionBanner, setShowResolutionBanner] = useState(false)
  const [showFlash, setShowFlash] = useState(false)

  const active_agents = is_demo_mode && currentPhase === 1 ? ['triage', 'root_cause'] : []

  const advanceToPhase = useCallback((phase: number) => {
    setCurrentPhase(phase)
    // Resolution celebration on phase 4
    if (phase === 4) {
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 600)
      setShowResolutionBanner(true)
      setTimeout(() => setShowResolutionBanner(false), 4000)
    }
  }, [])

  return (
    <DemoCtx.Provider value={{
      is_demo_mode,
      active_agents,
      currentPhase,
      showResolutionBanner,
      showFlash,
      advanceToPhase,
      toggle_demo: () => setDemo(d => !d),
    }}>
      {children}
    </DemoCtx.Provider>
  )
}
