import { useKV } from '@github/spark/hooks'
import { Post } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function BeritaPage() {
  const [posts] = useKV<Post[]>('posts', [])
  const [users] = useKV<any[]>('users', [])

  const publishedPosts = (posts || [])
    .filter(post => post.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getAuthorName = (authorId: string) => {
    const author = (users || []).find(u => u.id === authorId)
    return author?.name || 'Admin'
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Berita & Informasi</h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Update terbaru tentang kegiatan, prestasi, dan pengumuman Yayasan Kasih Ananda
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {publishedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Calendar size={48} className="text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Belum Ada Berita</h3>
              <p className="text-muted-foreground">
                Berita dan informasi terbaru akan segera ditampilkan di sini
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {publishedPosts.map((post) => (
                <Card key={post.id} className="p-6 md:p-8 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                        {post.title}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {format(new Date(post.createdAt), 'd MMMM yyyy', { locale: id })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>{getAuthorName(post.authorId)}</span>
                        </div>
                        <Badge variant="secondary">Berita</Badge>
                      </div>
                    </div>
                    <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </div>
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
