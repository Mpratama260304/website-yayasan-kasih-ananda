import { useKV } from '@github/spark/hooks'
import { GalleryPhoto, UnitType, GalleryCategory } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useState, useRef } from 'react'
import { Plus, Trash, Pencil, Image as ImageIcon, Folder, Tag, Calendar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateId } from '@/lib/auth'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface PhotoFormData {
  title: string
  description: string
  unit: UnitType
  category: string
}

export function GalleryPage() {
  const { session } = useAuth()
  const [photos, setPhotos] = useKV<GalleryPhoto[]>('gallery-photos', [])
  const [categories, setCategories] = useKV<GalleryCategory[]>('gallery-categories', [
    { id: '1', name: 'Kegiatan Belajar', unit: 'SD' },
    { id: '2', name: 'Olahraga', unit: 'SD' },
    { id: '3', name: 'Ekstrakurikuler', unit: 'SD' },
    { id: '4', name: 'Kegiatan Belajar', unit: 'SMP' },
    { id: '5', name: 'Olahraga', unit: 'SMP' },
    { id: '6', name: 'Ekstrakurikuler', unit: 'SMP' },
    { id: '7', name: 'Praktik Kerja', unit: 'SMK' },
    { id: '8', name: 'Kegiatan Belajar', unit: 'SMK' },
    { id: '9', name: 'Olahraga', unit: 'SMK' },
    { id: '10', name: 'Upacara & Peringatan', unit: 'YAYASAN' },
    { id: '11', name: 'Acara Yayasan', unit: 'YAYASAN' },
  ])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null)
  const [deletePhoto, setDeletePhoto] = useState<GalleryPhoto | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'ALL'>('ALL')
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<PhotoFormData>({
    title: '',
    description: '',
    unit: 'SD',
    category: '',
  })

  const [newCategory, setNewCategory] = useState({ name: '', unit: 'SD' as UnitType })

  const units: UnitType[] = ['SD', 'SMP', 'SMK', 'YAYASAN']
  const unitOptions = [
    { value: 'ALL', label: 'Semua Unit' },
    { value: 'SD', label: 'SD' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMK', label: 'SMK' },
    { value: 'YAYASAN', label: 'Yayasan' },
  ]

  const filteredPhotos = selectedUnit === 'ALL' 
    ? photos || []
    : (photos || []).filter(photo => photo.unit === selectedUnit)

  const sortedPhotos = filteredPhotos.sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )

  const getCategoriesForUnit = (unit: UnitType) => {
    return (categories || []).filter(cat => cat.unit === unit)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOpenDialog = (photo?: GalleryPhoto) => {
    if (photo) {
      setEditingPhoto(photo)
      setFormData({
        title: photo.title,
        description: photo.description,
        unit: photo.unit,
        category: photo.category,
      })
      setImagePreview(photo.imageData)
    } else {
      setEditingPhoto(null)
      setFormData({
        title: '',
        description: '',
        unit: 'SD',
        category: '',
      })
      setImagePreview('')
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPhoto(null)
    setFormData({
      title: '',
      description: '',
      unit: 'SD',
      category: '',
    })
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Judul foto harus diisi')
      return
    }

    if (!formData.category) {
      toast.error('Kategori harus dipilih')
      return
    }

    if (!imagePreview && !editingPhoto) {
      toast.error('Foto harus diupload')
      return
    }

    if (editingPhoto) {
      setPhotos((current) =>
        (current || []).map(photo =>
          photo.id === editingPhoto.id
            ? {
                ...photo,
                title: formData.title,
                description: formData.description,
                unit: formData.unit,
                category: formData.category,
                imageData: imagePreview || photo.imageData,
              }
            : photo
        )
      )
      toast.success('Foto berhasil diupdate')
    } else {
      const newPhoto: GalleryPhoto = {
        id: generateId(),
        title: formData.title,
        description: formData.description,
        imageData: imagePreview,
        unit: formData.unit,
        category: formData.category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session?.user?.name || 'Admin',
      }
      setPhotos((current) => [...(current || []), newPhoto])
      toast.success('Foto berhasil ditambahkan')
    }

    handleCloseDialog()
  }

  const handleDelete = () => {
    if (deletePhoto) {
      setPhotos((current) => (current || []).filter(photo => photo.id !== deletePhoto.id))
      toast.success('Foto berhasil dihapus')
      setDeletePhoto(null)
    }
  }

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('Nama kategori harus diisi')
      return
    }

    const category: GalleryCategory = {
      id: generateId(),
      name: newCategory.name,
      unit: newCategory.unit,
    }

    setCategories((current) => [...(current || []), category])
    toast.success('Kategori berhasil ditambahkan')
    setNewCategory({ name: '', unit: 'SD' })
    setIsCategoryDialogOpen(false)
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((current) => (current || []).filter(cat => cat.id !== categoryId))
    toast.success('Kategori berhasil dihapus')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Galeri Foto</h1>
          <p className="text-muted-foreground mt-1">
            Kelola foto kegiatan sekolah per unit
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Folder size={18} />
                Kelola Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kelola Kategori</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tambah Kategori Baru</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nama kategori"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                    <Select
                      value={newCategory.unit}
                      onValueChange={(value) => setNewCategory({ ...newCategory, unit: value as UnitType })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddCategory} className="w-full">
                    <Plus size={18} className="mr-2" />
                    Tambah Kategori
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Kategori Tersedia</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {units.map(unit => {
                      const unitCategories = getCategoriesForUnit(unit)
                      if (unitCategories.length === 0) return null
                      
                      return (
                        <div key={unit} className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">{unit}</p>
                          {unitCategories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{cat.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus size={18} />
                Tambah Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPhoto ? 'Edit Foto' : 'Tambah Foto Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Foto *</Label>
                  <div className="space-y-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Format: JPG, PNG. Maksimal 5MB
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value as UnitType, category: '' })}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoriesForUnit(formData.unit).map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul Foto *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Upacara Bendera 17 Agustus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat tentang foto ini..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingPhoto ? 'Update' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Filter Unit:</Label>
          <Select value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as UnitType | 'ALL')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            Total: {sortedPhotos.length} foto
          </span>
        </div>
      </Card>

      {sortedPhotos.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon size={64} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-4">
            Belum ada foto {selectedUnit !== 'ALL' ? `untuk unit ${selectedUnit}` : 'di galeri'}
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus size={18} className="mr-2" />
            Tambah Foto Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedPhotos.map(photo => (
            <Card key={photo.id} className="overflow-hidden group">
              <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                <img
                  src={photo.imageData}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleOpenDialog(photo)}
                  >
                    <Pencil size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setDeletePhoto(photo)}
                  >
                    <Trash size={18} />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {photo.unit}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Tag size={12} className="mr-1" />
                    {photo.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">
                  {photo.title}
                </h3>
                {photo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {photo.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar size={12} />
                  {format(new Date(photo.uploadedAt), 'dd MMM yyyy', { locale: id })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletePhoto} onOpenChange={() => setDeletePhoto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus foto "{deletePhoto?.title}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
