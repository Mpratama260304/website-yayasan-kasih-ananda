import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { uploadFile, checkUploadServer, getFileUrl } from '@/lib/upload'
import { toast } from 'sonner'
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  TextT,
  List,
  ListNumbers,
  LinkSimple,
  Image as ImageIcon,
  Table as TableIcon,
  Quotes,
  Code,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  Minus,
  Plus,
  Trash,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  CloudArrowUp,
  Spinner,
} from '@phosphor-icons/react'
import { useState, useCallback, useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onSelectMedia?: () => Promise<string | null>
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Tulis konten di sini...', 
  disabled = false,
  onSelectMedia 
}: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageTab, setImageTab] = useState<'url' | 'upload' | 'media'>('upload')
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-4 italic my-4',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-muted font-semibold border border-border p-2 text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !disabled,
    immediatelyRender: false,
  })

  if (!editor) {
    // Fallback UI while editor is initializing
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        rows={12}
      />
    )
  }

  const handleAddLink = () => {
    if (linkUrl) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      setLinkUrl('')
      setIsLinkModalOpen(false)
    }
  }

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run()
    setIsLinkModalOpen(false)
  }

  // Handle file selection for upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file melebihi 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file to server
    setIsUploading(true)
    try {
      const serverOnline = await checkUploadServer()
      if (!serverOnline) {
        toast.error('Server upload tidak tersedia. Jalankan: npm run server')
        setIsUploading(false)
        return
      }

      const result = await uploadFile(file)
      if (result.success && result.url) {
        setUploadedUrl(result.url)
        toast.success('Gambar berhasil diupload')
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengupload gambar')
      setUploadPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddImage = async () => {
    let url = ''
    
    if (imageTab === 'upload') {
      // Use uploaded URL
      if (uploadedUrl) {
        url = getFileUrl(uploadedUrl)
      } else {
        toast.error('Silakan upload gambar terlebih dahulu')
        return
      }
    } else if (imageTab === 'media' && onSelectMedia) {
      // Use Media Library picker
      const mediaUrl = await onSelectMedia()
      if (mediaUrl) {
        url = getFileUrl(mediaUrl)
      } else {
        return
      }
    } else if (imageTab === 'url') {
      // Use URL input
      url = imageUrl
    }

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
      // Reset state
      setImageUrl('')
      setUploadPreview(null)
      setUploadedUrl(null)
      setIsImageModalOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run()
    setIsTableModalOpen(false)
    setTableRows(3)
    setTableCols(3)
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
      )}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  )

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="border border-input rounded-md bg-muted/30 p-2 flex flex-wrap gap-1">
        {/* Headings */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <ToolbarButton
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run()}
              isActive={editor.isActive('heading', { level })}
              title={`Heading ${level}`}
            >
              <span className="text-[10px] font-bold">H{level}</span>
            </ToolbarButton>
          ))}
        </div>

        {/* Text formatting */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <TextB size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <TextItalic size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <TextUnderline size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <TextStrikethrough size={16} weight="bold" />
          </ToolbarButton>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <TextAlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <TextAlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <TextAlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <TextAlignJustify size={16} />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListNumbers size={16} weight="bold" />
          </ToolbarButton>
        </div>

        {/* Block elements */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quotes size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            isActive={false}
            title="Horizontal Rule"
          >
            <Minus size={16} weight="bold" />
          </ToolbarButton>
        </div>

        {/* Media & Links */}
        <div className="flex gap-0.5 border-r border-input pr-2 mr-1">
          <ToolbarButton
            onClick={() => {
              if (editor.isActive('link')) {
                const attrs = editor.getAttributes('link')
                setLinkUrl(attrs.href || '')
              }
              setIsLinkModalOpen(true)
            }}
            isActive={editor.isActive('link')}
            title="Add/Edit Link"
          >
            <LinkSimple size={16} weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsImageModalOpen(true)}
            isActive={false}
            title="Insert Image"
          >
            <ImageIcon size={16} weight="bold" />
          </ToolbarButton>
        </div>

        {/* Table */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => setIsTableModalOpen(true)}
            isActive={editor.isActive('table')}
            title="Insert Table"
          >
            <TableIcon size={16} weight="bold" />
          </ToolbarButton>
          
          {/* Table actions when inside a table */}
          {editor.isActive('table') && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                isActive={false}
                title="Add Column"
              >
                <ArrowsOutLineHorizontal size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                isActive={false}
                title="Add Row"
              >
                <ArrowsOutLineVertical size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                isActive={false}
                title="Delete Table"
              >
                <Trash size={16} className="text-destructive" />
              </ToolbarButton>
            </>
          )}
        </div>
      </div>

      {/* Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLink()
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {editor.isActive('link') && (
              <Button variant="destructive" onClick={handleRemoveLink}>
                Hapus Link
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddLink} disabled={!linkUrl}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={(open) => {
        setIsImageModalOpen(open)
        if (!open) {
          // Reset state on close
          setImageUrl('')
          setUploadPreview(null)
          setUploadedUrl(null)
          setImageTab('upload')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Gambar</DialogTitle>
          </DialogHeader>
          <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'upload' | 'media')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="media" disabled={!onSelectMedia}>Media Library</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="editor-image-upload"
              />
              {!uploadPreview ? (
                <label
                  htmlFor="editor-image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <CloudArrowUp size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Klik untuk pilih gambar</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF (maks 10MB)</p>
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="border rounded-md p-2 relative">
                    <img src={uploadPreview} alt="Preview" className="max-h-40 mx-auto object-contain" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Spinner size={24} className="animate-spin text-primary" />
                        <span className="ml-2 text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                  {uploadedUrl && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      ✓ Upload berhasil
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadPreview(null)
                      setUploadedUrl(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="w-full"
                  >
                    Pilih gambar lain
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label>URL Gambar</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddImage()
                  }}
                />
              </div>
              {imageUrl && (
                <div className="border rounded-md p-2">
                  <img src={imageUrl} alt="Preview" className="max-h-40 mx-auto object-contain" />
                </div>
              )}
            </TabsContent>
            <TabsContent value="media" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pilih gambar dari Media Library
              </p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleAddImage} 
              disabled={
                (imageTab === 'url' && !imageUrl) ||
                (imageTab === 'upload' && (!uploadedUrl || isUploading))
              }
            >
              {imageTab === 'media' ? 'Pilih dari Media' : 'Tambah Gambar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Tabel</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Baris</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-medium">{tableRows}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setTableRows(Math.min(10, tableRows + 1))}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kolom</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-medium">{tableCols}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setTableCols(Math.min(10, tableCols + 1))}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Tabel akan dibuat dengan {tableRows} baris × {tableCols} kolom, termasuk baris header
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleInsertTable}>
              Tambah Tabel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <div className="border border-input rounded-md bg-background overflow-hidden">
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none px-4 py-3 focus:outline-none min-h-80 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:text-foreground [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-2 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2"
        />
      </div>

      {/* Word count */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {editor.storage.characterCount?.words?.() || 0} kata
        </span>
        <span>
          {editor.storage.characterCount?.characters?.() || value.length} karakter
        </span>
      </div>
    </div>
  )
}
