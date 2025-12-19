import { useEffect, useState } from 'react'
import { GraduationCap, Users, BookOpen, Trophy, Images, Calendar, ArrowRight, Clock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RouteType } from '@/components/Router'
import { postsApi, Post } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface HomePageProps {
  onNavigate: (route: RouteType | string) => void
}

// Helper to strip HTML tags and get plain text
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

// Helper to create excerpt from content
function createExcerpt(content: string, maxLength: number = 150): string {
  const plainText = stripHtml(content)
  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength).trim() + '...'
}

// Helper to calculate reading time
function calculateReadingTime(content: string): number {
  const text = stripHtml(content)
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [latestPosts, setLatestPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  useEffect(() => {
    loadLatestPosts()
  }, [])

  const loadLatestPosts = async () => {
    try {
      setIsLoadingPosts(true)
      const posts = await postsApi.getAll({ status: 'PUBLISHED', limit: 3 })
      setLatestPosts(posts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const units = [
    {
      name: 'SD Kasih Ananda',
      description: 'Pendidikan dasar dengan kurikulum berkualitas dan lingkungan belajar yang menyenangkan',
      level: 'Sekolah Dasar',
    },
    {
      name: 'SMP Kasih Ananda',
      description: 'Pendidikan menengah pertama yang mengembangkan karakter dan prestasi akademik',
      level: 'Sekolah Menengah Pertama',
    },
    {
      name: 'SMK Kasih Ananda',
      description: 'Pendidikan kejuruan yang mempersiapkan siswa siap kerja dan berwirausaha',
      level: 'Sekolah Menengah Kejuruan',
    },
  ]

  const features = [
    {
      icon: BookOpen,
      title: 'Kurikulum Terintegrasi',
      description: 'Menggabungkan pendidikan akademik dengan pengembangan karakter',
    },
    {
      icon: Users,
      title: 'Tenaga Pendidik Profesional',
      description: 'Guru berpengalaman dan bersertifikat yang peduli pada setiap siswa',
    },
    {
      icon: Trophy,
      title: 'Prestasi Gemilang',
      description: 'Raih berbagai penghargaan tingkat kota, provinsi, dan nasional',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <GraduationCap size={40} weight="fill" className="text-primary-foreground md:scale-125" />
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Yayasan Kasih Ananda
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/95 leading-relaxed max-w-3xl mx-auto">
                Membangun Generasi Cerdas, Berkarakter, dan Berakhlak Mulia
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-8">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => onNavigate('ppdb')}
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold"
              >
                📝 Daftar Sekarang
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onNavigate('profil')}
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground font-semibold"
              >
                ℹ️ Tentang Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Units Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
              Unit Pendidikan Kami
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Tiga jenjang pendidikan berkualitas dengan standar internasional untuk masa depan putra-putri Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {units.map((unit, index) => (
              <Card key={index} className="p-6 md:p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-card border-2 border-primary/10 hover:border-primary/30">
                <div className="flex items-start gap-4 md:gap-5 mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={28} weight="fill" className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground break-words">{unit.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">{unit.level}</p>
                  </div>
                </div>
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                  {unit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
              Keunggulan Kami
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Komitmen kami untuk memberikan pendidikan terbaik dengan sentuhan nilai spiritual
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4 p-6 md:p-8 rounded-lg hover:bg-accent/5 transition-colors duration-300">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-accent/15 flex items-center justify-center">
                  <feature.icon size={32} weight="fill" className="text-accent" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-primary/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/15 flex items-center justify-center">
                <Images size={40} weight="duotone" className="text-accent" />
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Galeri Kegiatan
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Lihat dokumentasi kegiatan, prestasi, dan momen berharga siswa di seluruh unit Yayasan Kasih Ananda
              </p>
            </div>

            <div className="pt-4 md:pt-8">
              <Button
                size="lg"
                onClick={() => onNavigate('galeri')}
                className="px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                🖼️ Lihat Galeri Lengkap
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
              Berita Terbaru
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Informasi terkini dan pengumuman penting dari Yayasan Kasih Ananda
            </p>
          </div>

          {/* News Cards */}
          {isLoadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-10">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-10">
              {latestPosts.map((post) => {
                const excerpt = post.excerpt || createExcerpt(post.content)
                const readingTime = calculateReadingTime(post.content)
                
                return (
                  <Card 
                    key={post.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    onClick={() => onNavigate(`article-${post.slug}`)}
                  >
                    {/* Featured Image */}
                    {post.featuredImage ? (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {post.categories && post.categories.length > 0 && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                              {post.categories[0].name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                        <BookOpen size={48} className="text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-6 space-y-3">
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{format(new Date(post.createdAt), 'd MMM yyyy', { locale: id })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{readingTime} mnt</span>
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      
                      {/* Excerpt */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {excerpt}
                      </p>
                      
                      {/* Read More */}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary font-semibold text-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigate(`article-${post.slug}`)
                        }}
                      >
                        Baca Selengkapnya
                        <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Belum ada berita terbaru</p>
            </div>
          )}

          <div className="flex justify-center pt-4 md:pt-8">
            <Button
              size="lg"
              onClick={() => onNavigate('berita')}
              variant="outline"
              className="px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold"
            >
              📰 Baca Semua Berita
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-primary/90 to-accent/80 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Bergabunglah Dengan Kami
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/90 leading-relaxed">
              Daftarkan anak Anda sekarang dan mulai perjalanan pendidikan yang bermakna bersama Yayasan Kasih Ananda
            </p>
            <div className="pt-4 md:pt-8">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => onNavigate('ppdb')}
                className="px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                ✨ Mulai Pendaftaran
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
