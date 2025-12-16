import { useKV } from '@github/spark/hooks'
import { GalleryPhoto, UnitType, GalleryAlbum, PhotoComment } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useMemo, useEffect } from 'react'
import { Images, Calendar, X, MagnifyingGlass, Folders, Heart, ChatCircle, User } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { generateId } from '@/lib/auth'
import { toast } from 'sonner'

export function GaleriPage() {
  const [photos, setPhotos] = useKV<GalleryPhoto[]>('gallery-photos', [])
  const [albums] = useKV<GalleryAlbum[]>('gallery-albums', [])
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'ALL'>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'category' | 'album'>('category')
  const [commentText, setCommentText] = useState('')
  const [userName, setUserName] = useState('')

  const units: Array<{ value: UnitType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Semua' },
    { value: 'YAYASAN', label: 'Yayasan' },
    { value: 'SD', label: 'SD Kasih Ananda' },
    { value: 'SMP', label: 'SMP Kasih Ananda' },
    { value: 'SMK', label: 'SMK Kasih Ananda' },
  ]

  useEffect(() => {
    const savedName = localStorage.getItem('gallery-user-name')
    if (savedName) {
      setUserName(savedName)
    }
  }, [])

  const categories = useMemo(() => {
    const cats = new Set((photos || []).map(p => p.category))
    return Array.from(cats).sort()
  }, [photos])

  const filteredAlbums = useMemo(() => {
    return (albums || []).filter(album => 
      selectedUnit === 'ALL' || album.unit === selectedUnit
    )
  }, [albums, selectedUnit])

  const filteredPhotos = useMemo(() => {
    let filtered = photos || []

    if (selectedUnit !== 'ALL') {
      filtered = filtered.filter(photo => photo.unit === selectedUnit)
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(photo => photo.category === selectedCategory)
    }

    if (selectedAlbum !== 'ALL') {
      filtered = filtered.filter(photo => photo.albumId === selectedAlbum)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.title.toLowerCase().includes(query) ||
        photo.description.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [photos, selectedUnit, selectedCategory, selectedAlbum, searchQuery])

  const sortedPhotos = useMemo(() => {
    return [...filteredPhotos].sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  }, [filteredPhotos])

  const groupedByCategory = useMemo(() => {
    return sortedPhotos.reduce((acc, photo) => {
      const category = photo.category || 'Lainnya'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(photo)
      return acc
    }, {} as Record<string, GalleryPhoto[]>)
  }, [sortedPhotos])

  const groupedByAlbum = useMemo(() => {
    const grouped: Record<string, { album: GalleryAlbum | null; photos: GalleryPhoto[] }> = {}
    
    sortedPhotos.forEach(photo => {
      const albumId = photo.albumId || 'no-album'
      if (!grouped[albumId]) {
        const album = (albums || []).find(a => a.id === albumId)
        grouped[albumId] = { album: album || null, photos: [] }
      }
      grouped[albumId].photos.push(photo)
    })

    return grouped
  }, [sortedPhotos, albums])

  const handleLike = (photoId: string) => {
    if (!userName.trim()) {
      toast.error('Masukkan nama Anda untuk memberikan like')
      return
    }

    setPhotos((current) => {
      return (current || []).map(photo => {
        if (photo.id === photoId) {
          const likes = photo.likes || []
          const hasLiked = likes.includes(userName)
          
          if (hasLiked) {
            return {
              ...photo,
              likes: likes.filter(name => name !== userName)
            }
          } else {
            return {
              ...photo,
              likes: [...likes, userName]
            }
          }
        }
        return photo
      })
    })

    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => {
        if (!prev) return null
        const likes = prev.likes || []
        const hasLiked = likes.includes(userName)
        return {
          ...prev,
          likes: hasLiked ? likes.filter(name => name !== userName) : [...likes, userName]
        }
      })
    }
  }

  const handleComment = (photoId: string) => {
    if (!userName.trim()) {
      toast.error('Masukkan nama Anda untuk berkomentar')
      return
    }

    if (!commentText.trim()) {
      toast.error('Komentar tidak boleh kosong')
      return
    }

    localStorage.setItem('gallery-user-name', userName)

    const newComment: PhotoComment = {
      id: generateId(),
      photoId,
      userName,
      comment: commentText,
      createdAt: new Date().toISOString()
    }

    setPhotos((current) => {
      return (current || []).map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            comments: [...(photo.comments || []), newComment]
          }
        }
        return photo
      })
    })

    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => {
        if (!prev) return null
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment]
        }
      })
    }

    setCommentText('')
    toast.success('Komentar berhasil ditambahkan')
  }

  const resetFilters = () => {
    setSelectedUnit('ALL')
    setSelectedCategory('ALL')
    setSelectedAlbum('ALL')
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Images size={64} weight="duotone" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Galeri Kegiatan</h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Dokumentasi kegiatan dan prestasi Yayasan Kasih Ananda
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <Card className="p-6 mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari foto berdasarkan judul atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'category' ? 'default' : 'outline'}
                  onClick={() => setViewMode('category')}
                  className="gap-2"
                >
                  <Images size={18} />
                  Kategori
                </Button>
                <Button
                  variant={viewMode === 'album' ? 'default' : 'outline'}
                  onClick={() => setViewMode('album')}
                  className="gap-2"
                >
                  <Folders size={18} />
                  Album
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as UnitType | 'ALL')}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {viewMode === 'category' && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {viewMode === 'album' && (
                <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Pilih Album" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Album</SelectItem>
                    {filteredAlbums.map(album => (
                      <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(searchQuery || selectedUnit !== 'ALL' || selectedCategory !== 'ALL' || selectedAlbum !== 'ALL') && (
                <Button variant="ghost" onClick={resetFilters} className="whitespace-nowrap">
                  Reset Filter
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Menampilkan {sortedPhotos.length} foto</span>
            </div>
          </Card>

          {sortedPhotos.length === 0 ? (
            <Card className="p-12 text-center">
              <Images size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {searchQuery ? 'Tidak ada foto yang sesuai dengan pencarian' : 'Belum ada foto di galeri'}
              </p>
            </Card>
          ) : viewMode === 'album' ? (
            <div className="space-y-12">
              {Object.entries(groupedByAlbum).map(([albumId, { album, photos }]) => (
                <div key={albumId}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {album ? album.name : 'Tanpa Album'}
                    </h2>
                    {album?.description && (
                      <p className="text-muted-foreground">{album.description}</p>
                    )}
                    {album?.eventDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Calendar size={16} />
                        {format(new Date(album.eventDate), 'dd MMMM yyyy', { locale: id })}
                      </div>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {photos.length} foto
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {photos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedByCategory).map(([category, categoryPhotos]) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {category}
                    </Badge>
                    <span className="text-muted-foreground text-base font-normal">
                      ({categoryPhotos.length} foto)
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryPhotos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl pr-8">{selectedPhoto?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setSelectedPhoto(null)}
              >
                <X size={20} />
              </Button>
            </div>
          </DialogHeader>
          {selectedPhoto && (
            <div className="grid lg:grid-cols-3 gap-6 overflow-hidden">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedPhoto.imageData}
                    alt={selectedPhoto.title}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedPhoto.unit}</Badge>
                    <Badge variant="outline">{selectedPhoto.category}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(selectedPhoto.uploadedAt), 'dd MMMM yyyy', { locale: id })}
                    </span>
                  </div>
                  {selectedPhoto.description && (
                    <p className="text-foreground leading-relaxed">
                      {selectedPhoto.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(selectedPhoto.id)}
                      className="gap-2"
                    >
                      <Heart 
                        size={18} 
                        weight={(selectedPhoto.likes || []).includes(userName) ? 'fill' : 'regular'}
                        className={(selectedPhoto.likes || []).includes(userName) ? 'text-red-500' : ''}
                      />
                      {(selectedPhoto.likes || []).length}
                    </Button>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <ChatCircle size={18} />
                      {(selectedPhoto.comments || []).length} komentar
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col min-h-0">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ChatCircle size={20} />
                  Komentar
                </h3>
                <ScrollArea className="flex-1 pr-4 mb-4 h-[300px]">
                  {(selectedPhoto.comments || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Belum ada komentar
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(selectedPhoto.comments || []).map(comment => (
                        <div key={comment.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={16} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{comment.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm pl-10">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="space-y-2 pt-4 border-t">
                  <Input
                    placeholder="Nama Anda"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Tulis komentar..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => handleComment(selectedPhoto.id)}
                    className="w-full"
                    size="sm"
                  >
                    Kirim Komentar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PhotoCard({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        <img
          src={photo.imageData}
          alt={photo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1 bg-black/60 text-white border-0">
            <Heart size={12} weight="fill" />
            {(photo.likes || []).length}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1 bg-black/60 text-white border-0">
            <ChatCircle size={12} weight="fill" />
            {(photo.comments || []).length}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {photo.unit}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} />
            {format(new Date(photo.uploadedAt), 'dd MMM yyyy', { locale: id })}
          </span>
        </div>
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {photo.description}
          </p>
        )}
      </div>
    </Card>
  )
}
