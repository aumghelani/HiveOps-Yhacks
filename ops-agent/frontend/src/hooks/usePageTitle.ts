// Sets document.title for each page
import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — HiveOps` : 'HiveOps'
    return () => { document.title = 'HiveOps' }
  }, [title])
}
