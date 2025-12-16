import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { GraduationCap, SignIn } from '@phosphor-icons/react'
import { RouteType } from '@/components/Router'

interface LoginPageProps {
  onNavigate: (route: RouteType) => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('Username dan password wajib diisi')
      return
    }

    setLoading(true)
    
    try {
      const success = await login(username, password)
      
      if (success) {
        toast.success('Login berhasil!')
        onNavigate('admin-dashboard')
      } else {
        toast.error('Username atau password salah')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan, silakan coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap size={36} weight="fill" className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Yayasan Kasih Ananda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <SignIn size={20} className="mr-2" />
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('home')}
            className="text-sm"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  )
}
