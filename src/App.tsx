import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Router, RouteType } from '@/components/Router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdminLayout } from '@/components/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { ProfilPage } from '@/pages/ProfilPage'
import { BeritaPage } from '@/pages/BeritaPage'
import { GaleriPage } from '@/pages/GaleriPage'
import { PPDBPage } from '@/pages/PPDBPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { PostsPage } from '@/pages/admin/PostsPage'
import { GalleryPage } from '@/pages/admin/GalleryPage'
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage'
import { useEffect } from 'react'

function RouteHandler({ route, navigate }: { route: RouteType; navigate: (r: RouteType) => void }) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && route.startsWith('admin-') && route !== 'admin-login' && !isAuthenticated) {
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

  if (isAdminRoute && !isAuthenticated) {
    return null
  }

  if (isAdminRoute) {
    return (
      <AdminLayout currentRoute={route} onNavigate={navigate}>
        {route === 'admin-dashboard' && <DashboardPage onNavigate={navigate} />}
        {route === 'admin-posts' && <PostsPage />}
        {route === 'admin-gallery' && <GalleryPage />}
        {route === 'admin-enrollments' && <EnrollmentsPage />}
      </AdminLayout>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentRoute={route} onNavigate={navigate} />
      <main className="flex-1">
        {route === 'home' && <HomePage onNavigate={navigate} />}
        {route === 'profil' && <ProfilPage />}
        {route === 'berita' && <BeritaPage />}
        {route === 'galeri' && <GaleriPage />}
        {route === 'ppdb' && <PPDBPage />}
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
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App