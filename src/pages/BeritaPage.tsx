import { useEffect, useState } from 'react'
import { postsApi, Post } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User as UserIcon, ArrowRight, Clock } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface BeritaPageProps {
  onNavigate: (route: string) => void
}

// Helper to strip HTML tags and get plain text
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

// Helper to create excerpt from content
function createExcerpt(content: string, maxLength: number = 200): string {
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

export function BeritaPage({ onNavigate }: BeritaPageProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Only fetch published posts for public view
      const allPosts = await postsApi.getAll({ status: 'PUBLISHED' })
      setPosts(allPosts || [])
      console.log('✅ Posts loaded from API:', allPosts.length, 'posts')
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort by date (newest first)
  const publishedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Berita & Informasi
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/90 leading-relaxed">
              Update terbaru tentang kegiatan, prestasi, dan pengumuman Yayasan Kasih Ananda
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-16 md:py-24">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 rounded-full bg-muted flex items-center justify-center animate-pulse">
                <Calendar size={48} className="text-muted-foreground" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 md:mb-3">
                Memuat Berita...
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">
                Mengambil data dari server
              </p>
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 rounded-full bg-muted flex items-center justify-center">
                <Calendar size={48} className="text-muted-foreground" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 md:mb-3">
                Belum Ada Berita
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">
                Berita dan informasi terbaru akan segera ditampilkan di sini
              </p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 lg:space-y-10">
              {publishedPosts.map((post) => {
                const excerpt = post.excerpt || createExcerpt(post.content)
                const readingTime = calculateReadingTime(post.content)
                
                return (
                  <Card 
                    key={post.id} 
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-secondary/30 hover:border-l-secondary/60 bg-card group cursor-pointer"
                    onClick={() => onNavigate(`article-${post.slug}`)}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Featured Image */}
                      {post.featuredImage && (
                        <div className="relative w-full md:w-80 lg:w-96 flex-shrink-0">
                          <div className="aspect-video md:aspect-square lg:aspect-video">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 p-6 md:p-8 space-y-4">
                        {/* Categories */}
                        {post.categories && post.categories.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {post.categories.map(cat => (
                              <Badge key={cat.id} variant="secondary" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        
                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="flex-shrink-0 text-secondary/70" />
                            <span>
                              {format(new Date(post.createdAt), 'd MMMM yyyy', { locale: id })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserIcon size={16} className="flex-shrink-0 text-secondary/70" />
                            <span>{post.author?.name || 'Admin'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="flex-shrink-0 text-secondary/70" />
                            <span>{readingTime} menit baca</span>
                          </div>
                        </div>

                        {/* Excerpt */}
                        <p className="text-foreground/70 text-base leading-relaxed line-clamp-3">
                          {excerpt}
                        </p>

                        {/* Read More Button */}
                        <div className="pt-2">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-primary font-semibold group-hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onNavigate(`article-${post.slug}`)
                            }}
                          >
                            Baca Selengkapnya
                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-2 border-t border-muted">
                            {post.tags.map(tag => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                #{tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
