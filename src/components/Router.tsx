import { ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'

export type RouteType = 
  | 'home' 
  | 'profil' 
  | 'berita' 
  | 'ppdb' 
  | 'admin-login' 
  | 'admin-dashboard'
  | 'admin-posts'
  | 'admin-enrollments'

interface RouterProps {
  children: (route: RouteType, navigate: (route: RouteType) => void) => ReactNode
}

export function Router({ children }: RouterProps) {
  const [currentRoute, setCurrentRoute] = useKV<RouteType>('current-route', 'home')

  const navigate = (route: RouteType) => {
    setCurrentRoute(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <>{children(currentRoute || 'home', navigate)}</>
}
