import { useState, useEffect } from 'react'
import { Post, Category, Tag, MediaFile } from '@/lib/api'
import { postsApi, categoriesApi, tagsApi, mediaApi, uploadApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { isBase64, getFileUrl } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/RichTextEditor'
import { toast } from 'sonner'
import { Plus, Pencil, Trash, Eye, EyeSlash, Image as ImageIcon, X, Link as LinkIcon, MagnifyingGlass, Folder, Tag as TagIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Slugify helper
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Get display URL for images (handles both base64 and URL)
function getImageUrl(url: string): string {
  if (!url) return ''
  if (isBase64(url)) return url // Legacy base64
  return getFileUrl(url)
}

export function PostsPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    categoryIds: [] as string[],
    tagIds: [] as string[],
    featuredImage: '',
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [allPosts, allCategories, allTags, allMedia] = await Promise.all([
        postsApi.getAll(),
        categoriesApi.getAll(),
        tagsApi.getAll(),
        mediaApi.getAll({ type: 'image' }),
      ])
      setPosts(allPosts || [])
      setCategories(allCategories || [])
      setTags(allTags || [])
      setMedia(allMedia || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      // Search filter
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Status filter
      if (filterStatus === 'PUBLISHED' && post.status !== 'PUBLISHED') return false
      if (filterStatus === 'DRAFT' && post.status !== 'DRAFT') return false
      // Category filter
      if (filterCategory !== 'all' && !post.categories?.some(c => c.id === filterCategory)) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleOpenDialog = (post?: Post) => {
    if (post) {
      setEditingPost(post)
      setFormData({
        title: post.title,
        slug: post.slug || slugify(post.title),
        content: post.content,
        excerpt: post.excerpt || '',
        status: post.status,
        categoryIds: post.categories?.map(c => c.id) || [],
        tagIds: post.tags?.map(t => t.id) || [],
        featuredImage: post.featuredImage || '',
      })
    } else {
      setEditingPost(null)
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'DRAFT',
        categoryIds: [],
        tagIds: [],
        featuredImage: '',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPost(null)
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'DRAFT',
      categoryIds: [],
      tagIds: [],
      featuredImage: '',
    })
    setTagInput('')
  }

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-generate slug if it's a new post or slug is empty
      slug: !editingPost || !prev.slug ? slugify(title) : prev.slug
    }))
  }

  // Add tag from input or predefined
  const handleAddTag = (tagId: string) => {
    if (tagId && !formData.tagIds.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tagIds: [...prev.tagIds, tagId]
      }))
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.filter(t => t !== tagId)
    }))
  }

  // Toggle category
  const handleToggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(c => c !== categoryId)
        : [...prev.categoryIds, categoryId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Judul dan konten wajib diisi')
      return
    }

    if (!formData.slug.trim()) {
      toast.error('Slug wajib diisi')
      return
    }

    // Check slug uniqueness
    const existingSlug = posts.find(p => 
      p.slug === formData.slug && p.id !== editingPost?.id
    )
    if (existingSlug) {
      toast.error('Slug sudah digunakan oleh berita lain')
      return
    }

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        status: formData.status,
        categoryIds: formData.categoryIds,
        tagIds: formData.tagIds,
        featuredImage: formData.featuredImage || undefined,
      }

      if (editingPost) {
        const updatedPost = await postsApi.update(editingPost.id, postData)
        setPosts(posts.map(p => p.id === editingPost.id ? updatedPost : p))
        toast.success('Berita berhasil diupdate')
      } else {
        const newPost = await postsApi.create(postData)
        setPosts([newPost, ...posts])
        toast.success('Berita berhasil dibuat')
      }

      handleCloseDialog()
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Gagal menyimpan berita')
    }
  }

  const handleDelete = async (postId: string) => {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      try {
        await postsApi.delete(postId)
        setPosts(posts.filter(p => p.id !== postId))
        toast.success('Berita berhasil dihapus')
      } catch (error) {
        console.error('Error deleting post:', error)
        toast.error('Gagal menghapus berita')
      }
    }
  }

  const togglePublish = async (post: Post) => {
    try {
      const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      const updatedPost = await postsApi.update(post.id, { status: newStatus })
      setPosts(posts.map(p => p.id === post.id ? updatedPost : p))
      toast.success(newStatus === 'PUBLISHED' ? 'Berita dipublikasikan' : 'Berita disembunyikan')
    } catch (error) {
      console.error('Error toggling publish:', error)
      toast.error('Gagal mengubah status publikasi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kelola Berita</h1>
          <p className="text-muted-foreground">Buat dan kelola berita yayasan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={isLoading}>
              <Plus size={20} weight="bold" />
              Buat Berita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingPost ? 'Edit Berita' : 'Buat Berita Baru'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-2">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Konten</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Berita *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Masukkan judul berita"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                        placeholder="judul-berita-seo-friendly"
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData({ ...formData, slug: slugify(formData.title) })}
                        title="Generate dari judul"
                      >
                        <LinkIcon size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      URL: /berita/{formData.slug || 'slug-berita'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Ringkasan (Excerpt)</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Ringkasan singkat berita untuk preview..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Konten *</Label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Tulis konten berita di sini..."
                    />
                  </div>
                </TabsContent>

                {/* Metadata Tab */}
                <TabsContent value="metadata" className="space-y-6 mt-4">
                  {/* Categories */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Folder size={16} />
                      Kategori
                    </Label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada kategori. Buat kategori di menu Pengaturan.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <Badge
                            key={cat.id}
                            variant={formData.categoryIds.includes(cat.id) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleToggleCategory(cat.id)}
                          >
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <TagIcon size={16} />
                      Tag
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tagIds.map(tagId => {
                        const tag = tags.find(t => t.id === tagId)
                        return (
                          <Badge key={tagId} variant="secondary" className="gap-1">
                            {tag?.name || tagId}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tagId)}
                              className="hover:text-destructive"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag(tagInput)
                          }
                        }}
                        placeholder="Ketik tag dan tekan Enter"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddTag(tagInput)}
                        disabled={!tagInput.trim()}
                      >
                        Tambah
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Tag tersedia:</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.filter(t => !formData.tagIds.includes(t.id)).map(tag => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="cursor-pointer text-xs"
                              onClick={() => handleAddTag(tag.id)}
                            >
                              + {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publish Status */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Status Publikasi</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.status === 'PUBLISHED' ? 'Berita akan ditampilkan di website' : 'Berita tersimpan sebagai draft'}
                      </p>
                    </div>
                    <Switch
                      checked={formData.status === 'PUBLISHED'}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'PUBLISHED' : 'DRAFT' })}
                    />
                  </div>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon size={16} />
                      Featured Image
                    </Label>
                    
                    {formData.featuredImage ? (
                      <div className="relative inline-block">
                        <img
                          src={getImageUrl(formData.featuredImage)}
                          alt="Featured"
                          className="max-w-xs rounded-lg border"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => setFormData({ ...formData, featuredImage: '' })}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setMediaDialogOpen(true)}
                      >
                        <ImageIcon size={48} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Klik untuk memilih gambar
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaDialogOpen(true)}
                    >
                      {formData.featuredImage ? 'Ganti Gambar' : 'Pilih dari Media Library'}
                    </Button>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label>atau masukkan URL gambar</Label>
                    <Input
                      type="url"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background">
                <Button type="submit" className="flex-1">
                  {editingPost ? 'Update Berita' : 'Buat Berita'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berita..."
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse">
            <Plus size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Memuat Berita...</h3>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Tidak ada berita yang cocok'
              : 'Belum Ada Berita'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Coba ubah filter pencarian'
              : 'Mulai buat berita pertama untuk ditampilkan di website'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterCategory === 'all' && (
            <Button onClick={() => handleOpenDialog()}>
              Buat Berita Pertama
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Img</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      {post.featuredImage ? (
                        <img
                          src={getImageUrl(post.featuredImage)}
                          alt=""
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <ImageIcon size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={post.title}>{post.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        /{post.slug || slugify(post.title)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.categories?.slice(0, 2).map(cat => (
                          <Badge key={cat.id} variant="outline" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {(post.categories?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.categories!.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(post.createdAt), 'd MMM yyyy', { locale: localeId })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublish(post)}
                          title={post.status === 'PUBLISHED' ? 'Sembunyikan' : 'Publikasikan'}
                        >
                          {post.status === 'PUBLISHED' ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(post)}
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Media Selection Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Gambar</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {media.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Belum ada gambar. Upload gambar di Media Library.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {media.map((file) => (
                  <div
                    key={file.id}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      formData.featuredImage === file.url
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, featuredImage: file.url })
                      setMediaDialogOpen(false)
                    }}
                  >
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
