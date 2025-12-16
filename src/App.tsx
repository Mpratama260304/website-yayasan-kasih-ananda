import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Router, RouteType } from '@/components/Router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdminLayout } from '@/components/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { ProfilPage } from '@/pages/ProfilPage'
import { BeritaPage } from '@/pages/BeritaPage'
import { PPDBPage } from '@/pages/PPDBPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { PostsPage } from '@/pages/admin/PostsPage'
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage'
import { useEffect } from 'react'

function RouteHandler({ route, navigate }: { route: RouteType; navigate: (r: RouteType) => void }) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (route.startsWith('admin-') && route !== 'admin-login' && !isAuthenticated) {
      navigate('admin-login')
    }
  }, [route, isAuthenticated, navigate])

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