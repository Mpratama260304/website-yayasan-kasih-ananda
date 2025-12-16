import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { GraduationCap, House, Newspaper, ClipboardText, SignOut, SquaresFour, Images } from '@phosphor-icons/react'
import { RouteType } from './Router'
import { toast } from 'sonner'

interface AdminLayoutProps {
  children: ReactNode
  currentRoute: RouteType
  onNavigate: (route: RouteType) => void
}

export function AdminLayout({ children, currentRoute, onNavigate }: AdminLayoutProps) {
  const { session, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.success('Logout berhasil')
    onNavigate('home')
  }

  const navItems = [
    { route: 'admin-dashboard' as RouteType, label: 'Dashboard', icon: SquaresFour },
    { route: 'admin-posts' as RouteType, label: 'Berita', icon: Newspaper },
    { route: 'admin-gallery' as RouteType, label: 'Galeri', icon: Images },
    { route: 'admin-enrollments' as RouteType, label: 'Pendaftaran', icon: ClipboardText },
  ]

  return (
    <div className="min-h-screen bg-secondary/20">
      <nav className="sticky top-0 z-50 border-b bg-background shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={32} weight="fill" className="text-primary" />
              <div>
                <h1 className="font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Yayasan Kasih Ananda</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('home')}
                className="gap-2"
              >
                <House size={18} />
                <span className="hidden sm:inline">Ke Website</span>
              </Button>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <div className="hidden sm:flex items-center gap-2 px-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <SignOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-2">
              {navItems.map(({ route, label, icon: Icon }) => (
                <Button
                  key={route}
                  variant={currentRoute === route ? 'default' : 'ghost'}
                  onClick={() => onNavigate(route)}
                  className="w-full justify-start gap-3"
                >
                  <Icon size={20} />
                  {label}
                </Button>
              ))}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
