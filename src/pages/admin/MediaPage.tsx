import { useState, useEffect, useCallback } from 'react'
import { MediaFile } from '@/lib/types'
import { mediaApi, uploadApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { 
  deleteFile as deleteFileFromServer, 
  checkUploadServer,
  isBase64,
  getFileUrl
} from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, Trash, Eye, Copy, MagnifyingGlass, Image, FileDoc, FileZip, File, X, CloudArrowUp, Check, Warning, Link } from '@phosphor-icons/react'

const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf'],
  archives: ['application/zip', 'application/x-zip-compressed'],
}

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_TYPES.images,
  ...ALLOWED_TYPES.documents,
  ...ALLOWED_TYPES.archives,
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function MediaPage() {
  const { user } = useAuth()
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'images' | 'documents' | 'archives'>('all')
  
  // Upload
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Server status
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  
  // Preview
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null)
  
  // Delete
  const [deleteMedia, setDeleteMedia] = useState<MediaFile | null>(null)

  useEffect(() => {
    checkServer()
    loadMedia()
  }, [])

  const checkServer = async () => {
    const online = await checkUploadServer()
    setServerOnline(online)
    if (!online) {
      console.warn('⚠️ Upload server is offline')
    }
  }

  const loadMedia = async () => {
    try {
      setIsLoading(true)
      const files = await mediaApi.getAll()
      // Sort by newest first
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      setMedia(files)
    } catch (error) {
      console.error('Error loading media:', error)
      toast.error('Gagal memuat media')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Check server status
    if (!serverOnline) {
      toast.error('Server upload tidak tersedia. Pastikan server berjalan.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const uploadedFiles: MediaFile[] = []
    const totalFiles = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!ALL_ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Tipe file tidak didukung`)
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Ukuran file melebihi 10MB`)
        continue
      }

      try {
        // Upload file to server via API - returns MediaFile with id
        const result = await uploadApi.uploadFile(file)
        
        // Create MediaFile from upload result
        const mediaFile: MediaFile = {
          id: result.filename, // Use filename as temp ID
          filename: result.filename,
          originalName: result.originalName,
          mimeType: result.mimeType,
          size: result.size,
          url: result.url,
          uploadedBy: user?.id || 'unknown',
          uploadedAt: new Date().toISOString(),
        }

        uploadedFiles.push(mediaFile)
        
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast.error(`Gagal mengupload ${file.name}`)
      }
    }

    if (uploadedFiles.length > 0) {
      // Reload media to get proper IDs from database
      await loadMedia()
      toast.success(`${uploadedFiles.length} file berhasil diupload`)
    }

    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleDelete = async () => {
    if (!deleteMedia) return

    try {
      // Delete from server if it's a server URL
      if (deleteMedia.url && !isBase64(deleteMedia.url)) {
        await deleteFileFromServer(deleteMedia.url)
      }

      // Delete from database via API
      await mediaApi.delete(deleteMedia.id)
      setMedia(prev => prev.filter(m => m.id !== deleteMedia.id))
      toast.success('File berhasil dihapus')
    } catch (error) {
      console.error('Error deleting media:', error)
      toast.error('Gagal menghapus file')
    } finally {
      setDeleteMedia(null)
    }
  }

  const copyToClipboard = (url: string) => {
    // Always copy the full URL
    const fullUrl = getFileUrl(url)
    navigator.clipboard.writeText(fullUrl)
    toast.success('URL berhasil disalin')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={24} className="text-blue-500" />
    if (mimeType === 'application/pdf') return <FileDoc size={24} className="text-red-500" />
    if (mimeType.includes('zip')) return <FileZip size={24} className="text-yellow-500" />
    return <File size={24} className="text-gray-500" />
  }

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Gambar'
    if (mimeType === 'application/pdf') return 'PDF'
    if (mimeType.includes('zip')) return 'ZIP'
    return 'File'
  }

  // Get display URL (handle both base64 legacy and real URLs)
  const getDisplayUrl = (url: string) => {
    if (isBase64(url)) {
      return url // Legacy base64, display as-is
    }
    return getFileUrl(url)
  }

  // Check if file is legacy base64
  const isLegacyFile = (url: string) => isBase64(url)

  // Filter media
  const filteredMedia = media.filter(file => {
    // Search filter
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Type filter
    if (selectedType === 'images' && !file.mimeType.startsWith('image/')) return false
    if (selectedType === 'documents' && file.mimeType !== 'application/pdf') return false
    if (selectedType === 'archives' && !file.mimeType.includes('zip')) return false

    return true
  })

  // Count legacy files
  const legacyFileCount = media.filter(m => isBase64(m.url)).length

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }, [serverOnline])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Media Library</h1>
          <p className="text-muted-foreground">Kelola file gambar, dokumen, dan arsip</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Server Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            serverOnline === null 
              ? 'bg-muted text-muted-foreground' 
              : serverOnline 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serverOnline === null 
                ? 'bg-muted-foreground' 
                : serverOnline 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`} />
            {serverOnline === null ? 'Checking...' : serverOnline ? 'Server Online' : 'Server Offline'}
          </div>
          
          <input
            type="file"
            id="file-upload"
            multiple
            accept={ALL_ALLOWED_TYPES.join(',')}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading || !serverOnline}>
              <span>
                <Upload size={16} className="mr-2" />
                {isUploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Server Offline Warning */}
      {serverOnline === false && (
        <Alert variant="destructive">
          <Warning size={16} />
          <AlertDescription>
            Server upload tidak tersedia. Jalankan server dengan perintah: <code className="bg-muted px-1 rounded">npm run server</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Legacy Files Warning */}
      {legacyFileCount > 0 && (
        <Alert>
          <Warning size={16} />
          <AlertDescription>
            Terdapat {legacyFileCount} file lama (base64) yang perlu dimigrasi ke sistem penyimpanan baru untuk performa yang lebih baik.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : serverOnline
              ? 'border-muted-foreground/25 hover:border-muted-foreground/50'
              : 'border-destructive/25 bg-destructive/5'
        }`}
      >
        <CloudArrowUp size={48} className={`mx-auto mb-4 ${
          isDragging ? 'text-primary' : serverOnline ? 'text-muted-foreground' : 'text-destructive/50'
        }`} />
        <p className="text-lg font-medium mb-2">
          {isDragging ? 'Lepaskan file di sini' : 'Drag & drop file di sini'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          atau klik tombol Upload File di atas
        </p>
        <p className="text-xs text-muted-foreground">
          Format: JPG, PNG, WEBP, GIF, PDF, ZIP • Maks 10MB per file
        </p>
        <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
          <Link size={12} />
          File disimpan di server (same origin)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari file..."
            className="pl-10"
          />
        </div>
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="images">Gambar</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
            <TabsTrigger value="archives">Arsip</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <Image size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || selectedType !== 'all'
              ? 'Tidak ada file yang cocok'
              : 'Belum ada file. Upload file pertama Anda!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((file) => (
            <Card 
              key={file.id} 
              className={`group overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                isLegacyFile(file.url) ? 'ring-1 ring-amber-500/50' : ''
              }`}
              onClick={() => setPreviewMedia(file)}
            >
              <CardContent className="p-0">
                {/* Preview */}
                <div className="aspect-square relative bg-muted flex items-center justify-center">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={getDisplayUrl(file.url)}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4">
                      {getFileIcon(file.mimeType)}
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(file.mimeType)}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Legacy badge */}
                  {isLegacyFile(file.url) && (
                    <div className="absolute top-1 left-1">
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                        Legacy
                      </Badge>
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewMedia(file)
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(file.url)
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteMedia(file)
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewMedia?.filename}</DialogTitle>
            <DialogDescription>
              {previewMedia && (
                <span className="flex items-center gap-2 flex-wrap">
                  <span>{getFileTypeLabel(previewMedia.mimeType)}</span>
                  <span>•</span>
                  <span>{formatFileSize(previewMedia.size)}</span>
                  <span>•</span>
                  <span>Diupload {new Date(previewMedia.uploadedAt).toLocaleDateString('id-ID')}</span>
                  {isLegacyFile(previewMedia.url) && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">Legacy (base64)</Badge>
                    </>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto min-h-0">
            {previewMedia?.mimeType.startsWith('image/') ? (
              <img
                src={getDisplayUrl(previewMedia.url)}
                alt={previewMedia.filename}
                className="max-w-full max-h-[60vh] mx-auto object-contain"
              />
            ) : previewMedia?.mimeType === 'application/pdf' ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <FileDoc size={64} className="text-red-500" />
                <p className="text-muted-foreground">Preview PDF tidak tersedia</p>
                <a
                  href={getDisplayUrl(previewMedia.url)}
                  download={previewMedia.filename}
                  className="text-primary hover:underline"
                >
                  Download File
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                {previewMedia && getFileIcon(previewMedia.mimeType)}
                <p className="text-muted-foreground">Preview tidak tersedia</p>
                {previewMedia && (
                  <a
                    href={getDisplayUrl(previewMedia.url)}
                    download={previewMedia.filename}
                    className="text-primary hover:underline"
                  >
                    Download File
                  </a>
                )}
              </div>
            )}
          </div>

          {/* URL Display */}
          {previewMedia && !isLegacyFile(previewMedia.url) && (
            <div className="bg-muted rounded-md p-2 mt-2">
              <p className="text-xs text-muted-foreground mb-1">URL File:</p>
              <code className="text-xs break-all">{getDisplayUrl(previewMedia.url)}</code>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => previewMedia && copyToClipboard(previewMedia.url)}
            >
              <Copy size={16} className="mr-2" />
              Salin URL
            </Button>
            {previewMedia && (
              <a href={getDisplayUrl(previewMedia.url)} download={previewMedia.filename}>
                <Button variant="outline">Download</Button>
              </a>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                if (previewMedia) {
                  setDeleteMedia(previewMedia)
                  setPreviewMedia(null)
                }
              }}
            >
              <Trash size={16} className="mr-2" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMedia} onOpenChange={() => setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus File?</AlertDialogTitle>
            <AlertDialogDescription>
              File "{deleteMedia?.filename}" akan dihapus permanen dari server. 
              Tindakan ini tidak dapat dibatalkan.
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
