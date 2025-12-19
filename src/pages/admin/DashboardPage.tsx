import { useEffect, useState } from 'react'
import { dashboardApi, DashboardStats } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Newspaper, ClipboardText, Images, EnvelopeSimple, ArrowsClockwise } from '@phosphor-icons/react'
import { RouteType } from '@/components/Router'
import { toast } from 'sonner'

interface DashboardPageProps {
  onNavigate: (route: RouteType) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Gagal memuat statistik')
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Berita',
      value: stats?.posts.total || 0,
      subtitle: `${stats?.posts.published || 0} dipublikasikan`,
      icon: Newspaper,
      color: 'bg-primary/10 text-primary',
      action: () => onNavigate('admin-posts'),
    },
    {
      title: 'Foto Galeri',
      value: stats?.gallery.total || 0,
      subtitle: 'Foto terupload',
      icon: Images,
      color: 'bg-primary/10 text-primary',
      action: () => onNavigate('admin-gallery'),
    },
    {
      title: 'Pendaftaran',
      value: stats?.enrollments.total || 0,
      subtitle: `${stats?.enrollments.pending || 0} menunggu review`,
      icon: ClipboardText,
      color: 'bg-accent/10 text-accent',
      action: () => onNavigate('admin-enrollments'),
    },
    {
      title: 'Pesan Masuk',
      value: stats?.messages.total || 0,
      subtitle: `${stats?.messages.unread || 0} belum dibaca`,
      icon: EnvelopeSimple,
      color: (stats?.messages.unread || 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-accent/10 text-accent',
      action: () => onNavigate('admin-messages'),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di panel admin Yayasan Kasih Ananda</p>
        </div>
        <Button variant="outline" onClick={loadStats} disabled={isLoading}>
          <ArrowsClockwise size={18} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-muted mb-4" />
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              onClick={stat.action}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} weight="fill" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Kelola Berita</h2>
            <Newspaper size={24} className="text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            Buat, edit, dan kelola berita serta pengumuman yayasan
          </p>
          <Button onClick={() => onNavigate('admin-posts')} className="w-full">
            Buka Kelola Berita
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Galeri Foto</h2>
            <Images size={24} className="text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            Upload dan kelola foto kegiatan sekolah per unit
          </p>
          <Button onClick={() => onNavigate('admin-gallery')} className="w-full">
            Buka Galeri
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Data Pendaftaran</h2>
            <ClipboardText size={24} className="text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            Lihat dan kelola data pendaftaran siswa baru (PPDB)
          </p>
          <Button onClick={() => onNavigate('admin-enrollments')} className="w-full">
            Buka Data Pendaftaran
          </Button>
        </Card>

        <Card className={`p-6 ${(stats?.messages.unread || 0) > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Pesan Masuk</h2>
            <EnvelopeSimple size={24} className={(stats?.messages.unread || 0) > 0 ? 'text-red-600' : 'text-primary'} />
          </div>
          <p className="text-muted-foreground mb-6">
            {(stats?.messages.unread || 0) > 0 
              ? `${stats?.messages.unread} pesan baru menunggu dibaca`
              : 'Lihat dan kelola pesan dari pengunjung'
            }
          </p>
          <Button 
            onClick={() => onNavigate('admin-messages')} 
            className="w-full" 
            variant={(stats?.messages.unread || 0) > 0 ? 'destructive' : 'default'}
          >
            {(stats?.messages.unread || 0) > 0 ? `Lihat ${stats?.messages.unread} Pesan Baru` : 'Buka Pesan'}
          </Button>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <h2 className="text-xl font-semibold text-foreground mb-4">🎉 Sistem Database Aktif</h2>
        <p className="text-muted-foreground">
          Semua data website sekarang tersimpan di database PostgreSQL. Data akan tersinkronisasi 
          di semua perangkat dan tetap tersimpan meskipun browser ditutup atau server direstart.
        </p>
      </Card>
    </div>
  )
}
