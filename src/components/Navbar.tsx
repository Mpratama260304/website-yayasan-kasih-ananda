import { House, Newspaper, Users, GraduationCap, List, SignIn } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { RouteType } from './Router'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NavbarProps {
  currentRoute: RouteType
  onNavigate: (route: RouteType) => void
}

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  const navItems = [
    { route: 'home' as RouteType, label: 'Beranda', icon: House },
    { route: 'profil' as RouteType, label: 'Profil', icon: GraduationCap },
    { route: 'berita' as RouteType, label: 'Berita', icon: Newspaper },
    { route: 'ppdb' as RouteType, label: 'PPDB', icon: Users },
  ]

  const handleNavigate = (route: RouteType) => {
    onNavigate(route)
    setOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <GraduationCap size={32} weight="fill" />
            <span className="hidden sm:inline">Yayasan Kasih Ananda</span>
            <span className="sm:hidden">YKA</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ route, label, icon: Icon }) => (
              <Button
                key={route}
                variant={currentRoute === route ? 'default' : 'ghost'}
                onClick={() => handleNavigate(route)}
                className="gap-2"
              >
                <Icon size={20} />
                {label}
              </Button>
            ))}
            <div className="w-px h-6 bg-border mx-2"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
              className="gap-2"
            >
              <SignIn size={18} />
              Admin
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map(({ route, label, icon: Icon }) => (
                  <Button
                    key={route}
                    variant={currentRoute === route ? 'default' : 'ghost'}
                    onClick={() => handleNavigate(route)}
                    className="w-full justify-start gap-2"
                  >
                    <Icon size={20} />
                    {label}
                  </Button>
                ))}
                <div className="my-2 border-t"></div>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
                  className="w-full justify-start gap-2"
                >
                  <SignIn size={20} />
                  Admin Panel
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
