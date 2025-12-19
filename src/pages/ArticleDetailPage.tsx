import { useEffect, useState } from 'react'
import { postsApi, Post } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User as UserIcon, ArrowLeft, ShareNetwork, Clock } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface ArticleDetailPageProps {
  slug: string
  onNavigate: (route: string) => void
}

export function ArticleDetailPage({ slug, onNavigate }: ArticleDetailPageProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadArticle()
  }, [slug])

  // Update document title and meta tags when post loads
  useEffect(() => {
    if (post) {
      // Update page title
      document.title = `${post.title} | Yayasan Kasih Ananda`
      
      // Update meta description
      let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.name = 'description'
        document.head.appendChild(metaDesc)
      }
      const excerpt = post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)
      metaDesc.content = excerpt
      
      // Add canonical URL
      let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = `${window.location.origin}/berita/${slug}`
      
      // Add Open Graph tags for social sharing
      const ogTags = {
        'og:title': post.title,
        'og:description': excerpt,
        'og:type': 'article',
        'og:url': `${window.location.origin}/berita/${slug}`,
        'og:image': post.featuredImage || ''
      }
      
      Object.entries(ogTags).forEach(([property, content]) => {
        if (!content) return
        let meta = document.querySelector(`meta[property='${property}']`) as HTMLMetaElement
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.content = content
      })
    }
    
    // Cleanup: restore default title when leaving
    return () => {
      document.title = 'Yayasan Kasih Ananda'
    }
  }, [post, slug])

  const loadArticle = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const article = await postsApi.getBySlug(slug)
      setPost(article)
      console.log('✅ Article loaded:', article.title)
    } catch (err) {
      console.error('❌ Error loading article:', err)
      setError('Artikel tidak ditemukan')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate reading time (roughly 200 words per minute)
  const calculateReadingTime = (content: string): number => {
    const text = content.replace(/<[^>]*>/g, '') // Strip HTML tags
    const words = text.split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg text-muted-foreground">Memuat artikel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-5xl">😕</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Artikel Tidak Ditemukan
            </h1>
            <p className="text-lg text-muted-foreground">
              Maaf, artikel yang Anda cari tidak ditemukan atau sudah dihapus.
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate('berita')}
              className="mt-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali ke Berita
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const readingTime = calculateReadingTime(post.content)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero/Header Section */}
      <section className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('berita')}
              className="mb-6 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <ArrowLeft size={18} className="mr-2" />
              Kembali ke Berita
            </Button>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {post.categories.map(cat => (
                  <Badge 
                    key={cat.id} 
                    variant="secondary"
                    className="bg-secondary-foreground/20 text-secondary-foreground border-0"
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-secondary-foreground/80">
              <div className="flex items-center gap-2">
                <UserIcon size={18} className="flex-shrink-0" />
                <span>{post.author?.name || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="flex-shrink-0" />
                <span>
                  {format(new Date(post.publishedAt || post.createdAt), 'd MMMM yyyy', { locale: id })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="flex-shrink-0" />
                <span>{readingTime} menit baca</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <article className="max-w-4xl mx-auto">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative aspect-video rounded-xl overflow-hidden mb-8 md:mb-12 shadow-lg -mt-8 md:-mt-12">
                <img 
                  src={post.featuredImage} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <Card className="p-6 mb-8 bg-secondary/5 border-l-4 border-l-secondary">
                <p className="text-lg md:text-xl text-foreground/80 italic leading-relaxed">
                  {post.excerpt}
                </p>
              </Card>
            )}

            {/* Main Content */}
            <div 
              className="prose prose-lg md:prose-xl max-w-none text-foreground/90 leading-relaxed
                [&>p]:mb-6 [&>p]:text-justify
                [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-10 [&>h1]:mb-4
                [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4
                [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                [&>ul]:ml-6 [&>ul]:mb-6 [&>ul]:list-disc
                [&>ol]:ml-6 [&>ol]:mb-6 [&>ol]:list-decimal
                [&>li]:mb-2
                [&>blockquote]:border-l-4 [&>blockquote]:border-secondary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:my-6
                [&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-6
                [&>a]:text-primary [&>a]:underline [&>a]:hover:text-primary/80
                [&>strong]:font-semibold
                [&>em]:italic
                [&>code]:bg-muted [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm
                [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-muted">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">Tags:</h4>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="text-sm">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-muted">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShareNetwork size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Bagikan artikel ini:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = window.location.href
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                    }}
                  >
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = window.location.href
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`, '_blank')
                    }}
                  >
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = window.location.href
                      window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' - ' + url)}`, '_blank')
                    }}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {/* Back to News */}
            <div className="mt-12 text-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate('berita')}
              >
                <ArrowLeft size={18} className="mr-2" />
                Lihat Berita Lainnya
              </Button>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
