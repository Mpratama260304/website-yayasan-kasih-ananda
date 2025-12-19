import { ReactNode, useState, useEffect } from 'react'

export type RouteType = 
  | 'home' 
  | 'profil' 
  | 'berita' 
  | 'ppdb'
  | 'galeri'
  | 'kontak'
  | 'admin-login' 
  | 'admin-dashboard'
  | 'admin-posts'
  | 'admin-enrollments'
  | 'admin-gallery'
  | 'admin-messages'
  | 'admin-settings'
  | 'admin-media'
  | 'admin-profile'
  | `article-${string}` // Dynamic article routes with slug

// Helper to extract slug from article route
export function getArticleSlug(route: string): string | null {
  if (route.startsWith('article-')) {
    return route.substring(8) // Remove 'article-' prefix
  }
  return null
}

// Helper to check if route is an article detail page
export function isArticleRoute(route: string): boolean {
  return route.startsWith('article-')
}

// Map URL paths to internal route types
function pathToRoute(pathname: string): RouteType | string {
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') // Remove trailing slash
  
  switch (path) {
    case '/':
    case '':
      return 'home'
    case '/profil':
      return 'profil'
    case '/berita':
      return 'berita'
    case '/ppdb':
      return 'ppdb'
    case '/galeri':
      return 'galeri'
    case '/kontak':
      return 'kontak'
    case '/admin':
    case '/admin/login':
      return 'admin-login'
    case '/admin/dashboard':
      return 'admin-dashboard'
    case '/admin/posts':
      return 'admin-posts'
    case '/admin/enrollments':
      return 'admin-enrollments'
    case '/admin/gallery':
      return 'admin-gallery'
    case '/admin/messages':
      return 'admin-messages'
    case '/admin/settings':
      return 'admin-settings'
    case '/admin/media':
      return 'admin-media'
    case '/admin/profile':
      return 'admin-profile'
    default:
      // Check if it's an article path (e.g., /article/my-article-slug or /berita/my-article-slug)
      if (path.startsWith('/article/')) {
        return `article-${path.substring(9)}`
      }
      if (path.startsWith('/berita/')) {
        return `article-${path.substring(8)}`
      }
      // Treat any other path as a potential article slug (for clean permalinks)
      if (path.startsWith('/') && !path.includes('/admin')) {
        const slug = path.substring(1)
        if (slug && !['profil', 'berita', 'ppdb', 'galeri', 'kontak'].includes(slug)) {
          return `article-${slug}`
        }
      }
      return 'home'
  }
}

// Map internal route types to URL paths
function routeToPath(route: RouteType | string): string {
  if (route.startsWith('article-')) {
    const slug = route.substring(8)
    return `/berita/${slug}`
  }
  
  switch (route) {
    case 'home':
      return '/'
    case 'profil':
      return '/profil'
    case 'berita':
      return '/berita'
    case 'ppdb':
      return '/ppdb'
    case 'galeri':
      return '/galeri'
    case 'kontak':
      return '/kontak'
    case 'admin-login':
      return '/admin/login'
    case 'admin-dashboard':
      return '/admin/dashboard'
    case 'admin-posts':
      return '/admin/posts'
    case 'admin-enrollments':
      return '/admin/enrollments'
    case 'admin-gallery':
      return '/admin/gallery'
    case 'admin-messages':
      return '/admin/messages'
    case 'admin-settings':
      return '/admin/settings'
    case 'admin-media':
      return '/admin/media'
    case 'admin-profile':
      return '/admin/profile'
    default:
      return '/'
  }
}

interface RouterProps {
  children: (route: RouteType, navigate: (route: RouteType | string) => void) => ReactNode
}

export function Router({ children }: RouterProps) {
  const [currentRoute, setCurrentRoute] = useState<RouteType | string>(() => {
    // Initialize from current URL path
    return pathToRoute(window.location.pathname)
  })

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newRoute = pathToRoute(window.location.pathname)
      setCurrentRoute(newRoute)
      console.log('📍 Popstate navigation to:', newRoute)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (route: RouteType | string) => {
    const newPath = routeToPath(route)
    
    // Only push state if path actually changed
    if (window.location.pathname !== newPath) {
      window.history.pushState({ route }, '', newPath)
    }
    
    setCurrentRoute(route as RouteType)
    console.log('📍 Navigating to:', route, '→', newPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <>{children(currentRoute as RouteType, navigate)}</>
}
