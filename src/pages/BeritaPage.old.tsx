import { useEffect, useState } from 'react'
import { Post, User } from '@/lib/types'
import { getDatabase } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User as UserIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function BeritaPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const db = getDatabase()
      const [allPosts, allUsers] = await Promise.all([
        db.getPosts(),
        db.getUsers()
      ])
      setPosts(allPosts || [])
      setUsers(allUsers || [])
      console.log('✅ Posts and users loaded:', allPosts.length, 'posts')
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const publishedPosts = posts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getAuthorName = (authorId: string) => {
    const author = users.find(u => u.id === authorId)
    return author?.name || 'Admin'
  }

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
                Mengambil data dari database
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
              {publishedPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="p-6 md:p-8 lg:p-10 hover:shadow-lg transition-all duration-300 border-l-4 border-l-secondary/30 hover:border-l-secondary/60 bg-card"
                >
                  <div className="space-y-4 md:space-y-6">
                    {/* Title */}
                    <div>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 md:mb-5 leading-tight">
                        {post.title}
                      </h2>
                      
                      {/* Meta Information */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 text-sm md:text-base text-muted-foreground pb-4 md:pb-5 border-b border-muted">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="flex-shrink-0 text-secondary/70" />
                          <span>
                            {format(new Date(post.createdAt), 'd MMMM yyyy', { locale: id })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon size={18} className="flex-shrink-0 text-secondary/70" />
                          <span>{getAuthorName(post.authorId)}</span>
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          📰 Berita
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div 
                      className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-foreground/80 leading-relaxed [&>p]:mb-4 [&>p]:text-justify [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-3 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>ul]:ml-4 [&>ul]:mb-4 [&>ol]:ml-4 [&>ol]:mb-4 [&>li]:mb-2 [&>strong]:font-semibold [&>em]:italic"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
