import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Post } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { generateId } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash, Eye, EyeSlash } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function PostsPage() {
  const { session } = useAuth()
  const [posts, setPosts] = useKV<Post[]>('posts', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  })

  const sortedPosts = [...(posts || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleOpenDialog = (post?: Post) => {
    if (post) {
      setEditingPost(post)
      setFormData({
        title: post.title,
        content: post.content,
        published: post.published,
      })
    } else {
      setEditingPost(null)
      setFormData({ title: '', content: '', published: false })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPost(null)
    setFormData({ title: '', content: '', published: false })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Judul dan konten wajib diisi')
      return
    }

    if (editingPost) {
      setPosts((current) =>
        (current || []).map((post) =>
          post.id === editingPost.id
            ? { ...post, title: formData.title, content: formData.content, published: formData.published }
            : post
        )
      )
      toast.success('Berita berhasil diupdate')
    } else {
      const newPost: Post = {
        id: generateId(),
        title: formData.title,
        content: formData.content,
        published: formData.published,
        authorId: session?.userId || '',
        createdAt: new Date().toISOString(),
      }
      setPosts((current) => [...(current || []), newPost])
      toast.success('Berita berhasil dibuat')
    }

    handleCloseDialog()
  }

  const handleDelete = (postId: string) => {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      setPosts((current) => (current || []).filter((post) => post.id !== postId))
      toast.success('Berita berhasil dihapus')
    }
  }

  const togglePublish = (post: Post) => {
    setPosts((current) =>
      (current || []).map((p) =>
        p.id === post.id ? { ...p, published: !p.published } : p
      )
    )
    toast.success(post.published ? 'Berita disembunyikan' : 'Berita dipublikasikan')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kelola Berita</h1>
          <p className="text-muted-foreground">Buat dan kelola berita yayasan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus size={20} weight="bold" />
              Buat Berita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Edit Berita' : 'Buat Berita Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Berita *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul berita"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Konten *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis konten berita di sini..."
                  rows={12}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="published" className="cursor-pointer">
                  Publikasikan berita
                </Label>
              </div>

              <div className="flex gap-3">
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

      {sortedPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Belum Ada Berita</h3>
          <p className="text-muted-foreground mb-6">
            Mulai buat berita pertama untuk ditampilkan di website
          </p>
          <Button onClick={() => handleOpenDialog()}>
            Buat Berita Pertama
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate">{post.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(post.createdAt), 'd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublish(post)}
                          title={post.published ? 'Sembunyikan' : 'Publikasikan'}
                        >
                          {post.published ? <EyeSlash size={18} /> : <Eye size={18} />}
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
    </div>
  )
}
