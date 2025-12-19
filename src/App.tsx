import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Router, RouteType, isArticleRoute, getArticleSlug } from '@/components/Router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdminLayout } from '@/components/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { ProfilPage } from '@/pages/ProfilPage'
import { BeritaPage } from '@/pages/BeritaPage'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { GaleriPage } from '@/pages/GaleriPage'
import { PPDBPage } from '@/pages/PPDBPage'
import { KontakPage } from '@/pages/KontakPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { PostsPage } from '@/pages/admin/PostsPage'
import { GalleryPage } from '@/pages/admin/GalleryPage'
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage'
import { MessagesPage } from '@/pages/admin/MessagesPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { MediaPage } from '@/pages/admin/MediaPage'
import { ProfilePage } from '@/pages/admin/ProfilePage'
import { seedDatabase } from '@/lib/seed'
import { useEffect, useState } from 'react'
import { settingsApi, GlobalSettings } from '@/lib/api'

// Component to handle dynamic favicon and meta tags
function DynamicMeta() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null)

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(console.error)
  }, [])

  useEffect(() => {
    if (!settings) return

    // Update page title
    if (settings.siteName) {
      document.title = `${settings.siteName} - Lembaga Pendidikan Berkualitas`
    }

    // Update favicon
    if (settings.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = settings.favicon
    }

    // Update meta description
    if (settings.siteDescription) {
      let meta = document.querySelector("meta[name='description']") as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = settings.siteDescription
    }
  }, [settings])

  return null
}

function RouteHandler({ route, navigate }: { route: RouteType; navigate: (r: RouteType) => void }) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Only redirect if:
    // 1. Auth loading is complete AND
    // 2. User is on admin route AND
    // 3. User is NOT authenticated AND
    // 4. User is not already on login page
    if (!isLoading && route.startsWith('admin-') && route !== 'admin-login' && !isAuthenticated) {
      console.log('🔐 Redirecting unauthenticated user to admin-login')
      navigate('admin-login')
    }
  }, [route, isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  if (route === 'admin-login') {
    return <LoginPage onNavigate={navigate} />
  }

  const isAdminRoute = route.startsWith('admin-')

  // If admin route and not authenticated, deny access
  if (isAdminRoute && !isAuthenticated) {
    console.log('🔐 Admin route requires authentication, showing login')
    return <LoginPage onNavigate={navigate} />
  }

  // If admin route and authenticated, render the admin page (no redirect!)
  if (isAdminRoute && isAuthenticated) {
    return (
      <AdminLayout currentRoute={route} onNavigate={navigate}>
        {route === 'admin-dashboard' && <DashboardPage onNavigate={navigate} />}
        {route === 'admin-posts' && <PostsPage />}
        {route === 'admin-gallery' && <GalleryPage />}
        {route === 'admin-enrollments' && <EnrollmentsPage />}
        {route === 'admin-messages' && <MessagesPage />}
        {route === 'admin-settings' && <SettingsPage />}
        {route === 'admin-media' && <MediaPage />}
        {route === 'admin-profile' && <ProfilePage />}
      </AdminLayout>
    )
  }

  // Public routes
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentRoute={route} onNavigate={navigate} />
      <main className="flex-1">
        {route === 'home' && <HomePage onNavigate={navigate} />}
        {route === 'profil' && <ProfilPage />}
        {route === 'berita' && <BeritaPage onNavigate={navigate} />}
        {isArticleRoute(route) && (
          <ArticleDetailPage 
            slug={getArticleSlug(route) || ''} 
            onNavigate={navigate} 
          />
        )}
        {route === 'galeri' && <GaleriPage />}
        {route === 'ppdb' && <PPDBPage />}
        {route === 'kontak' && <KontakPage />}
      </main>
      <Footer />
    </div>
  )
}

function AppContent() {
  return (
    <Router>
      {(route, navigate) => <RouteHandler route={route} navigate={navigate} />}
    </Router>
  )
}

function App() {
  useEffect(() => {
    // Initialize database with seed data
    seedDatabase().catch(error => console.error('Failed to seed database:', error))
  }, [])

  return (
    <AuthProvider>
      <DynamicMeta />
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App