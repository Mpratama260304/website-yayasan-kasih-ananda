import { useKV } from '@github/spark/hooks'
import { GalleryPhoto, UnitType } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Images, Calendar, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function GaleriPage() {
  const [photos] = useKV<GalleryPhoto[]>('gallery-photos', [])
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'ALL'>('ALL')

  const units: Array<{ value: UnitType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Semua' },
    { value: 'YAYASAN', label: 'Yayasan' },
    { value: 'SD', label: 'SD Kasih Ananda' },
    { value: 'SMP', label: 'SMP Kasih Ananda' },
    { value: 'SMK', label: 'SMK Kasih Ananda' },
  ]

  const filteredPhotos = selectedUnit === 'ALL' 
    ? photos || []
    : (photos || []).filter(photo => photo.unit === selectedUnit)

  const sortedPhotos = filteredPhotos.sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )

  const groupedByCategory = sortedPhotos.reduce((acc, photo) => {
    const category = photo.category || 'Lainnya'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(photo)
    return acc
  }, {} as Record<string, GalleryPhoto[]>)

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
          <div className="mb-8">
            <Tabs value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as UnitType | 'ALL')}>
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                {units.map(unit => (
                  <TabsTrigger key={unit.value} value={unit.value} className="whitespace-nowrap">
                    {unit.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {sortedPhotos.length === 0 ? (
            <Card className="p-12 text-center">
              <Images size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Belum ada foto di galeri {selectedUnit !== 'ALL' ? `unit ${selectedUnit}` : 'ini'}
              </p>
            </Card>
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
                      <Card 
                        key={photo.id} 
                        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={photo.imageData}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedPhoto.imageData}
                  alt={selectedPhoto.title}
                  className="w-full h-auto"
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
