import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ThemeProvider'
import { DemoProvider } from '@/components/DemoContext'
import { AppLayout } from '@/components/AppLayout'
import { IncidentsPage } from '@/pages/IncidentsPage'
import { IncidentDetailPage } from '@/pages/IncidentDetailPage'
import { MemoryBankPage } from '@/pages/MemoryBankPage'
import { PlaybooksPage } from '@/pages/PlaybooksPage'
import { AuditLogPage } from '@/pages/AuditLogPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DemoProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<IncidentsPage />} />
                <Route path="/incident/:id" element={<IncidentDetailPage />} />
                <Route path="/memory" element={<MemoryBankPage />} />
                <Route path="/playbooks" element={<PlaybooksPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DemoProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
