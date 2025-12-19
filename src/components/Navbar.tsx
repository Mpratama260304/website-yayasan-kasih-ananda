import { House, Newspaper, Users, GraduationCap, List, SignIn, Images, EnvelopeSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { RouteType, isArticleRoute } from './Router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { settingsApi, GlobalSettings } from '@/lib/api'

interface NavbarProps {
  currentRoute: RouteType | string
  onNavigate: (route: RouteType | string) => void
}

// Helper to check if a nav item should be active
function isNavItemActive(currentRoute: string, itemRoute: string): boolean {
  if (currentRoute === itemRoute) return true
  // Article pages should highlight 'berita' nav item
  if (itemRoute === 'berita' && isArticleRoute(currentRoute)) return true
  return false
}

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<GlobalSettings | null>(null)

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(console.error)
  }, [])

  const siteName = settings?.siteName || 'Yayasan Kasih Ananda'
  const siteLogo = settings?.logo

  const navItems = [
    { route: 'home' as RouteType, label: 'Beranda', icon: House },
    { route: 'profil' as RouteType, label: 'Profil', icon: GraduationCap },
    { route: 'berita' as RouteType, label: 'Berita', icon: Newspaper },
    { route: 'galeri' as RouteType, label: 'Galeri', icon: Images },
    { route: 'ppdb' as RouteType, label: 'PPDB', icon: Users },
    { route: 'kontak' as RouteType, label: 'Kontak', icon: EnvelopeSimple },
  ]

  const handleNavigate = (route: RouteType | string) => {
    onNavigate(route)
    setOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-3 md:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 lg:h-18 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 text-lg md:text-xl font-bold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            ) : (
              <GraduationCap size={28} weight="fill" className="text-primary w-7 h-7 md:w-8 md:h-8" />
            )}
            <span className="hidden sm:inline text-sm md:text-base">{siteName}</span>
            <span className="sm:hidden font-bold">YKA</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(({ route, label, icon: Icon }) => (
              <Button
                key={route}
                variant={isNavItemActive(currentRoute, route) ? 'default' : 'ghost'}
                onClick={() => handleNavigate(route)}
                className="gap-2 text-sm lg:text-base px-3 lg:px-4 py-2 h-auto"
              >
                <Icon size={18} className="hidden lg:inline" />
                {label}
              </Button>
            ))}
            <div className="w-px h-6 bg-border mx-1 lg:mx-2"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
              className="gap-2 text-xs lg:text-sm px-3 lg:px-4"
            >
              <SignIn size={16} className="hidden lg:inline" />
              <span className="hidden lg:inline">Admin</span>
              <span className="lg:hidden">+</span>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80 p-0">
              <div className="flex flex-col gap-2 mt-8 px-4">
                <div className="mb-2 pb-4 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">Menu Utama</p>
                </div>
                {navItems.map(({ route, label, icon: Icon }) => (
                  <Button
                    key={route}
                    variant={isNavItemActive(currentRoute, route) ? 'default' : 'ghost'}
                    onClick={() => handleNavigate(route)}
                    className="w-full justify-start gap-3 text-base px-4 py-3 h-auto"
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Button>
                ))}
                <div className="my-2 border-t pt-2"></div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mt-2">Admin</p>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
                  className="w-full justify-start gap-3 text-base px-4 py-3 h-auto"
                >
                  <SignIn size={20} />
                  <span>{isAuthenticated ? 'Dashboard' : 'Login'}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
