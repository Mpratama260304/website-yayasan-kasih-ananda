import { useState, useEffect, useRef } from 'react'
import { GlobalSettings, Category, Tag, uploadApi } from '@/lib/api'
import { settingsApi, categoriesApi, tagsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Gear, Globe, ClipboardText, Tag as TagIcon, Folder, Plus, Trash, Pencil, 
  FacebookLogo, InstagramLogo, YoutubeLogo, WhatsappLogo, TwitterLogo,
  Phone, Envelope, MapPin, CheckCircle, XCircle, Image, Upload, X
} from '@phosphor-icons/react'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Category/Tag Dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [tagForm, setTagForm] = useState({ name: '' })
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'tag'; id: string; name: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [loadedSettings, loadedCategories, loadedTags] = await Promise.all([
        settingsApi.get(),
        categoriesApi.getAll(),
        tagsApi.getAll()
      ])
      setSettings(loadedSettings)
      setCategories(loadedCategories)
      setTags(loadedTags)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setIsLoading(false)
    }
  }

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !settings) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 5MB for logo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setIsUploadingLogo(true)
      const result = await uploadApi.uploadFile(file)
      setSettings({ ...settings, logo: result.url })
      toast.success('Logo berhasil diupload')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Gagal mengupload logo')
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // Favicon upload handler
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !settings) return

    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      toast.error('File harus berupa ICO, PNG, atau SVG')
      return
    }

    // Validate file size (max 1MB for favicon)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 1MB')
      return
    }

    try {
      setIsUploadingFavicon(true)
      const result = await uploadApi.uploadFile(file)
      setSettings({ ...settings, favicon: result.url })
      toast.success('Favicon berhasil diupload')
    } catch (error) {
      console.error('Error uploading favicon:', error)
      toast.error('Gagal mengupload favicon')
    } finally {
      setIsUploadingFavicon(false)
      if (faviconInputRef.current) faviconInputRef.current.value = ''
    }
  }

  // Remove logo/favicon
  const handleRemoveLogo = () => {
    if (settings) {
      setSettings({ ...settings, logo: undefined })
      toast.success('Logo dihapus')
    }
  }

  const handleRemoveFavicon = () => {
    if (settings) {
      setSettings({ ...settings, favicon: undefined })
      toast.success('Favicon dihapus')
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return
    try {
      setIsSaving(true)
      await settingsApi.update(settings)
      toast.success('Pengaturan berhasil disimpan')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setIsSaving(false)
    }
  }

  // Category handlers
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name, description: category.description || '' })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '' })
    }
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Nama kategori wajib diisi')
      return
    }
    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        slug: slugify(categoryForm.name),
        description: categoryForm.description.trim() || undefined,
      }
      
      let savedCategory: Category
      if (editingCategory) {
        savedCategory = await categoriesApi.update(editingCategory.id, categoryData)
        setCategories(categories.map(c => c.id === savedCategory.id ? savedCategory : c))
      } else {
        savedCategory = await categoriesApi.create(categoryData)
        setCategories([...categories, savedCategory])
      }
      setCategoryDialogOpen(false)
      toast.success(editingCategory ? 'Kategori diupdate' : 'Kategori ditambahkan')
    } catch (error) {
      toast.error('Gagal menyimpan kategori')
    }
  }

  // Tag handlers
  const handleOpenTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      setTagForm({ name: tag.name })
    } else {
      setEditingTag(null)
      setTagForm({ name: '' })
    }
    setTagDialogOpen(true)
  }

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error('Nama tag wajib diisi')
      return
    }
    try {
      const tagData = {
        name: tagForm.name.trim(),
        slug: slugify(tagForm.name),
      }
      
      let savedTag: Tag
      if (editingTag) {
        savedTag = await tagsApi.update(editingTag.id, tagData)
        setTags(tags.map(t => t.id === savedTag.id ? savedTag : t))
      } else {
        savedTag = await tagsApi.create(tagData)
        setTags([...tags, savedTag])
      }
      setTagDialogOpen(false)
      toast.success(editingTag ? 'Tag diupdate' : 'Tag ditambahkan')
    } catch (error) {
      toast.error('Gagal menyimpan tag')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      if (deleteItem.type === 'category') {
        await categoriesApi.delete(deleteItem.id)
        setCategories(categories.filter(c => c.id !== deleteItem.id))
      } else {
        await tagsApi.delete(deleteItem.id)
        setTags(tags.filter(t => t.id !== deleteItem.id))
      }
      toast.success(`${deleteItem.type === 'category' ? 'Kategori' : 'Tag'} berhasil dihapus`)
    } catch (error) {
      toast.error('Gagal menghapus')
    } finally {
      setDeleteItem(null)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Pengaturan CMS</h1>
        <p className="text-muted-foreground">Kelola pengaturan situs, PPDB, kategori, dan tag</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Globe size={16} />
            Umum
          </TabsTrigger>
          <TabsTrigger value="ppdb" className="gap-2">
            <ClipboardText size={16} />
            PPDB
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Folder size={16} />
            Kategori
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <TagIcon size={16} />
            Tag
          </TabsTrigger>
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                Informasi Situs
              </CardTitle>
              <CardDescription>Pengaturan dasar website yayasan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Situs</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="Nama Yayasan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Input
                    value={settings.siteDescription || ''}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder="Deskripsi singkat situs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LOGO & FAVICON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image size={20} />
                Logo & Favicon
              </CardTitle>
              <CardDescription>Upload logo dan favicon untuk website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Logo Website</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {settings.logo ? (
                      <div className="space-y-3">
                        <img 
                          src={settings.logo} 
                          alt="Logo" 
                          className="max-h-24 mx-auto object-contain"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                          >
                            <Upload size={14} className="mr-1" />
                            Ganti
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleRemoveLogo}
                          >
                            <X size={14} className="mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="py-6 cursor-pointer hover:bg-muted/50 rounded transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isUploadingLogo ? 'Mengupload...' : 'Klik untuk upload logo'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, atau WebP (maks 5MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {settings.favicon ? (
                      <div className="space-y-3">
                        <img 
                          src={settings.favicon} 
                          alt="Favicon" 
                          className="w-16 h-16 mx-auto object-contain"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => faviconInputRef.current?.click()}
                            disabled={isUploadingFavicon}
                          >
                            <Upload size={14} className="mr-1" />
                            Ganti
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleRemoveFavicon}
                          >
                            <X size={14} className="mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="py-6 cursor-pointer hover:bg-muted/50 rounded transition-colors"
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isUploadingFavicon ? 'Mengupload...' : 'Klik untuk upload favicon'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ICO, PNG, atau SVG (maks 1MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                      className="hidden"
                      onChange={handleFaviconUpload}
                      disabled={isUploadingFavicon}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={20} />
                Informasi Kontak
              </CardTitle>
              <CardDescription>Informasi kontak yang ditampilkan di website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone size={14} />
                    Telepon/WhatsApp
                  </Label>
                  <Input
                    value={settings.contactPhone || ''}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Envelope size={14} />
                    Email
                  </Label>
                  <Input
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    placeholder="info@yayasan.sch.id"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin size={14} />
                  Alamat
                </Label>
                <Textarea
                  value={settings.contactAddress || ''}
                  onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                  placeholder="Alamat lengkap yayasan"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Sosial</CardTitle>
              <CardDescription>Link ke akun media sosial yayasan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FacebookLogo size={14} weight="fill" className="text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    value={settings.socialMedia?.facebook || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <InstagramLogo size={14} weight="fill" className="text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    value={settings.socialMedia?.instagram || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <YoutubeLogo size={14} weight="fill" className="text-red-600" />
                    YouTube
                  </Label>
                  <Input
                    value={settings.socialMedia?.youtube || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, youtube: e.target.value }
                    })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <WhatsappLogo size={14} weight="fill" className="text-green-600" />
                    WhatsApp
                  </Label>
                  <Input
                    value={settings.socialMedia?.whatsapp || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, whatsapp: e.target.value }
                    })}
                    placeholder="https://wa.me/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </TabsContent>

        {/* PPDB SETTINGS */}
        <TabsContent value="ppdb" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardText size={20} />
                Status PPDB
              </CardTitle>
              <CardDescription>Kontrol status pendaftaran peserta didik baru</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="font-semibold">Pendaftaran PPDB</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.ppdbOpen 
                      ? 'Form pendaftaran aktif dan bisa diakses publik'
                      : 'Form pendaftaran ditutup untuk publik'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={settings.ppdbOpen ? 'default' : 'secondary'} className="gap-1">
                    {settings.ppdbOpen ? (
                      <><CheckCircle size={14} weight="fill" /> DIBUKA</>
                    ) : (
                      <><XCircle size={14} weight="fill" /> DITUTUP</>
                    )}
                  </Badge>
                  <Switch
                    checked={settings.ppdbOpen}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      ppdbOpen: checked
                    })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pesan Saat PPDB Dibuka</Label>
                  <Textarea
                    value={settings.ppdbOpenMessage || ''}
                    onChange={(e) => setSettings({ ...settings, ppdbOpenMessage: e.target.value })}
                    placeholder="Pendaftaran Peserta Didik Baru sedang dibuka!"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pesan Saat PPDB Ditutup</Label>
                  <Textarea
                    value={settings.ppdbClosedMessage || ''}
                    onChange={(e) => setSettings({ ...settings, ppdbClosedMessage: e.target.value })}
                    placeholder="Pendaftaran Peserta Didik Baru saat ini ditutup."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </TabsContent>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Folder size={20} />
                  Kategori Berita
                </CardTitle>
                <CardDescription>Kelola kategori untuk berita/artikel</CardDescription>
              </div>
              <Button onClick={() => handleOpenCategoryDialog()} className="gap-2">
                <Plus size={16} />
                Tambah Kategori
              </Button>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada kategori. Klik tombol di atas untuk menambahkan.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenCategoryDialog(category)}>
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteItem({ type: 'category', id: category.id, name: category.name })}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAGS */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon size={20} />
                  Tag Berita
                </CardTitle>
                <CardDescription>Kelola tag untuk berita/artikel</CardDescription>
              </div>
              <Button onClick={() => handleOpenTagDialog()} className="gap-2">
                <Plus size={16} />
                Tambah Tag
              </Button>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada tag. Klik tombol di atas untuk menambahkan.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 p-4">
                  {tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary" 
                      className="gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-secondary/80"
                    >
                      #{tag.name}
                      <button 
                        onClick={() => handleOpenTagDialog(tag)}
                        className="hover:text-primary"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        onClick={() => setDeleteItem({ type: 'tag', id: tag.id, name: tag.name })}
                        className="hover:text-destructive"
                      >
                        <Trash size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Contoh: Kegiatan Sekolah"
              />
              {categoryForm.name && (
                <p className="text-xs text-muted-foreground">Slug: /{slugify(categoryForm.name)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Deskripsi singkat kategori..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveCategory}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Tambah Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Tag *</Label>
              <Input
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                placeholder="Contoh: prestasi"
              />
              {tagForm.name && (
                <p className="text-xs text-muted-foreground">Slug: #{slugify(tagForm.name)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTag}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleteItem?.type === 'category' ? 'Kategori' : 'Tag'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus "{deleteItem?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
