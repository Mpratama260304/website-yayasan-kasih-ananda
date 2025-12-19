import { GalleryPhoto, UnitType, GalleryAlbum } from '@/lib/api'
import { galleryApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useMemo, useEffect } from 'react'
import { Images, Calendar, MagnifyingGlass, Folders, Heart, Eye } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { getFileUrl, isBase64 } from '@/lib/upload'

export function GaleriPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'ALL'>('ALL')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'album'>('all')

  const units: Array<{ value: UnitType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Semua' },
    { value: 'YAYASAN', label: 'Yayasan' },
    { value: 'SD', label: 'SD Kasih Ananda' },
    { value: 'SMP', label: 'SMP Kasih Ananda' },
    { value: 'SMK', label: 'SMK Kasih Ananda' },
  ]

  // Load gallery data from API
  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        setIsLoading(true)
        const [loadedPhotos, loadedAlbums] = await Promise.all([
          galleryApi.getPhotos(),
          galleryApi.getAlbums()
        ])
        setPhotos(loadedPhotos || [])
        setAlbums(loadedAlbums || [])
      } catch (error) {
        console.error('Error loading gallery:', error)
        toast.error('Gagal memuat galeri')
      } finally {
        setIsLoading(false)
      }
    }
    loadGalleryData()
  }, [])

  // Helper to get photo URL
  const getPhotoUrl = (photo: GalleryPhoto) => {
    if (photo.fileUrl) {
      if (isBase64(photo.fileUrl)) {
        return photo.fileUrl
      }
      return getFileUrl(photo.fileUrl)
    }
    return ''
  }

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

    if (selectedAlbum !== 'ALL') {
      filtered = filtered.filter(photo => photo.albumId === selectedAlbum)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.title.toLowerCase().includes(query) ||
        (photo.description || '').toLowerCase().includes(query)
      )
    }

    return filtered
  }, [photos, selectedUnit, selectedAlbum, searchQuery])

  const sortedPhotos = useMemo(() => {
    return [...filteredPhotos].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [filteredPhotos])

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

  const resetFilters = () => {
    setSelectedUnit('ALL')
    setSelectedAlbum('ALL')
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <div className="flex justify-center mb-4 md:mb-6">
              <Images size={48} weight="duotone" className="md:scale-125" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Galeri Kegiatan
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              Dokumentasi kegiatan dan prestasi Yayasan Kasih Ananda
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {isLoading ? (
            <Card className="p-8 md:p-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-6 md:h-8 bg-muted rounded w-1/3 mx-auto"></div>
                <div className="h-4 md:h-5 bg-muted rounded w-2/3 mx-auto"></div>
              </div>
            </Card>
          ) : (
            <>
              {/* Filter Card */}
              <Card className="p-4 md:p-6 lg:p-8 mb-8 md:mb-10 lg:mb-12 space-y-4 md:space-y-6 border-t-4 border-t-primary/30 shadow-sm">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari foto berdasarkan judul atau deskripsi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant={viewMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setViewMode('all')}
                      className="flex-1 sm:flex-none gap-2 h-10 md:h-11 text-sm md:text-base"
                      size="sm"
                    >
                      <Images size={18} />
                      Semua
                    </Button>
                    <Button
                      variant={viewMode === 'album' ? 'default' : 'outline'}
                      onClick={() => setViewMode('album')}
                      className="flex-1 sm:flex-none gap-2 h-10 md:h-11 text-sm md:text-base"
                      size="sm"
                    >
                      <Folders size={18} />
                      Album
                    </Button>
                  </div>
                </div>

                {/* Filter Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <Select value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as UnitType | 'ALL')}>
                    <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {viewMode === 'album' && (
                    <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
                      <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
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

                  {(searchQuery || selectedUnit !== 'ALL' || selectedAlbum !== 'ALL') && (
                    <Button variant="outline" onClick={resetFilters} className="h-10 md:h-11 text-sm md:text-base">
                      ✕ Reset Filter
                    </Button>
                  )}
                </div>

                {/* Photo Count */}
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground pt-2 md:pt-4 border-t border-muted">
                  <span className="font-medium">📷 Menampilkan <strong>{sortedPhotos.length}</strong> foto</span>
                </div>
              </Card>

              {/* Empty State */}
              {sortedPhotos.length === 0 ? (
                <Card className="p-8 md:p-12 lg:p-16 text-center bg-muted/30">
                  <Images size={64} className="mx-auto mb-4 md:mb-6 text-muted-foreground" />
                  <p className="text-base md:text-lg text-muted-foreground font-medium">
                    {searchQuery ? '🔍 Tidak ada foto yang sesuai dengan pencarian' : '📷 Belum ada foto di galeri'}
                  </p>
                </Card>
              ) : viewMode === 'album' ? (
                // Album View
                <div className="space-y-12">
                  {Object.entries(groupedByAlbum).map(([albumId, { album, photos: albumPhotos }]) => (
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
                          {albumPhotos.length} foto
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {albumPhotos.map(photo => (
                          <PhotoCard key={photo.id} photo={photo} getPhotoUrl={getPhotoUrl} onClick={() => setSelectedPhoto(photo)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedPhotos.map(photo => (
                    <PhotoCard key={photo.id} photo={photo} getPhotoUrl={getPhotoUrl} onClick={() => setSelectedPhoto(photo)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl pr-8">{selectedPhoto?.title}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={getPhotoUrl(selectedPhoto)}
                    alt={selectedPhoto.title}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedPhoto.unit}</Badge>
                    {selectedPhoto.album && (
                      <Badge variant="outline">{selectedPhoto.album.name}</Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(selectedPhoto.createdAt), 'dd MMMM yyyy', { locale: id })}
                    </span>
                  </div>
                  {selectedPhoto.description && (
                    <p className="text-foreground leading-relaxed">
                      {selectedPhoto.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart size={16} /> {selectedPhoto.likes || 0} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={16} /> {selectedPhoto.views || 0} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PhotoCard({ 
  photo, 
  getPhotoUrl, 
  onClick 
}: { 
  photo: GalleryPhoto
  getPhotoUrl: (photo: GalleryPhoto) => string
  onClick: () => void 
}) {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        <img
          src={getPhotoUrl(photo)}
          alt={photo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1 bg-black/60 text-white border-0">
            <Heart size={12} weight="fill" />
            {photo.likes || 0}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1 bg-black/60 text-white border-0">
            <Eye size={12} />
            {photo.views || 0}
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
            {format(new Date(photo.createdAt), 'dd MMM yyyy', { locale: id })}
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
