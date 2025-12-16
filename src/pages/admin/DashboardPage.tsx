import { useKV } from '@github/spark/hooks'
import { Post, Enrollment } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Newspaper, ClipboardText, Eye, EyeSlash } from '@phosphor-icons/react'
import { RouteType } from '@/components/Router'

interface DashboardPageProps {
  onNavigate: (route: RouteType) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [posts] = useKV<Post[]>('posts', [])
  const [enrollments] = useKV<Enrollment[]>('enrollments', [])

  const publishedPosts = (posts || []).filter(p => p.published).length
  const draftPosts = (posts || []).filter(p => !p.published).length
  const pendingEnrollments = (enrollments || []).filter(e => e.status === 'PENDING').length
  const totalEnrollments = (enrollments || []).length

  const stats = [
    {
      title: 'Total Berita',
      value: (posts || []).length,
      icon: Newspaper,
      color: 'bg-primary/10 text-primary',
      action: () => onNavigate('admin-posts'),
    },
    {
      title: 'Berita Publish',
      value: publishedPosts,
      icon: Eye,
      color: 'bg-accent/10 text-accent',
      action: () => onNavigate('admin-posts'),
    },
    {
      title: 'Draft Berita',
      value: draftPosts,
      icon: EyeSlash,
      color: 'bg-muted text-muted-foreground',
      action: () => onNavigate('admin-posts'),
    },
    {
      title: 'Pendaftaran Baru',
      value: pendingEnrollments,
      icon: ClipboardText,
      color: 'bg-accent/10 text-accent',
      action: () => onNavigate('admin-enrollments'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di panel admin Yayasan Kasih Ananda</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
      </div>

      {totalEnrollments > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Statistik Pendaftaran</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {(['SD', 'SMP', 'SMK'] as const).map((unit) => {
              const count = (enrollments || []).filter(e => e.unit === unit).length
              return (
                <div key={unit} className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">{unit} Kasih Ananda</p>
                  <p className="text-2xl font-bold text-foreground">{count} Pendaftar</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
