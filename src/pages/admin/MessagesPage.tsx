import { useEffect, useState } from 'react'
import { ContactMessage, ContactMessageStatus } from '@/lib/api'
import { contactApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  EnvelopeSimple, 
  MagnifyingGlass, 
  Eye, 
  Trash, 
  Phone, 
  User,
  Calendar,
  CheckCircle,
  ChatCircle,
  EnvelopeOpen,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

export function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'ALL'>('ALL')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null)

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const data = await contactApi.getAll()
      // Sort by createdAt DESC (newest first)
      const sorted = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setMessages(sorted)
      console.log('✅ Messages loaded:', sorted.length)
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      toast.error('Gagal memuat pesan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message)
    setIsViewDialogOpen(true)

    // Mark as READ if NEW
    if (message.status === 'NEW') {
      try {
        const updatedMessage = await contactApi.updateStatus(message.id, 'READ')
        setMessages(prev => prev.map(m => 
          m.id === message.id ? updatedMessage : m
        ))
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    }
  }

  const handleStatusChange = async (messageId: string, newStatus: ContactMessageStatus) => {
    try {
      const updatedMessage = await contactApi.updateStatus(messageId, newStatus)
      setMessages(prev => prev.map(m => 
        m.id === messageId ? updatedMessage : m
      ))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(updatedMessage)
      }
      toast.success(`Status diubah ke ${getStatusLabel(newStatus)}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const handleDelete = async () => {
    if (!deleteMessageId) return

    try {
      await contactApi.delete(deleteMessageId)
      setMessages(prev => prev.filter(m => m.id !== deleteMessageId))
      toast.success('Pesan berhasil dihapus')
      setDeleteMessageId(null)
      if (selectedMessage?.id === deleteMessageId) {
        setIsViewDialogOpen(false)
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Gagal menghapus pesan')
    }
  }

  const getStatusLabel = (status: ContactMessageStatus): string => {
    switch (status) {
      case 'NEW': return 'Baru'
      case 'READ': return 'Dibaca'
      case 'REPLIED': return 'Dibalas'
      default: return status
    }
  }

  const getStatusBadge = (status: ContactMessageStatus) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="destructive" className="gap-1"><EnvelopeSimple size={14} />Baru</Badge>
      case 'READ':
        return <Badge variant="secondary" className="gap-1"><EnvelopeOpen size={14} />Dibaca</Badge>
      case 'REPLIED':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle size={14} />Dibalas</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchQuery || 
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || message.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats
  const newCount = messages.filter(m => m.status === 'NEW').length
  const readCount = messages.filter(m => m.status === 'READ').length
  const repliedCount = messages.filter(m => m.status === 'REPLIED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pesan Masuk</h1>
          <p className="text-muted-foreground">Kelola pesan dari pengunjung website</p>
        </div>
        <Button onClick={loadMessages} variant="outline" className="gap-2">
          <ArrowsClockwise size={18} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-foreground">{messages.length}</p>
          <p className="text-sm text-muted-foreground">Total Pesan</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl md:text-3xl font-bold text-red-600">{newCount}</p>
          <p className="text-sm text-muted-foreground">Belum Dibaca</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl md:text-3xl font-bold text-yellow-600">{readCount}</p>
          <p className="text-sm text-muted-foreground">Sudah Dibaca</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl md:text-3xl font-bold text-green-600">{repliedCount}</p>
          <p className="text-sm text-muted-foreground">Sudah Dibalas</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, email, subjek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as ContactMessageStatus | 'ALL')}
          >
            <SelectTrigger className="w-full sm:w-48 h-11">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="NEW">🔴 Baru</SelectItem>
              <SelectItem value="READ">🟡 Dibaca</SelectItem>
              <SelectItem value="REPLIED">🟢 Dibalas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Messages List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
        </Card>
      ) : filteredMessages.length === 0 ? (
        <Card className="p-12 text-center">
          <EnvelopeSimple size={64} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery || statusFilter !== 'ALL' ? 'Tidak Ada Hasil' : 'Belum Ada Pesan'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Coba ubah filter pencarian Anda'
              : 'Pesan dari pengunjung akan muncul di sini'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card 
              key={message.id} 
              className={`p-4 md:p-6 hover:shadow-md transition-all cursor-pointer ${
                message.status === 'NEW' ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''
              }`}
              onClick={() => handleViewMessage(message)}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.status === 'NEW' ? 'bg-red-100' : 
                  message.status === 'READ' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {message.status === 'NEW' ? (
                    <EnvelopeSimple size={24} className="text-red-600" />
                  ) : message.status === 'READ' ? (
                    <EnvelopeOpen size={24} className="text-yellow-600" />
                  ) : (
                    <CheckCircle size={24} className="text-green-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{message.name}</h3>
                    {getStatusBadge(message.status)}
                  </div>
                  <p className="font-medium text-foreground mb-1 truncate">{message.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(message.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
                    </span>
                    <span className="flex items-center gap-1">
                      <EnvelopeSimple size={14} />
                      {message.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {message.phone}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewMessage(message)
                    }}
                    className="gap-1"
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline">Lihat</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteMessageId(message.id)
                    }}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ChatCircle size={24} className="text-primary" />
              Detail Pesan
            </DialogTitle>
            <DialogDescription>
              Pesan dari {selectedMessage?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Status & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <Select 
                    value={selectedMessage.status} 
                    onValueChange={(value) => handleStatusChange(selectedMessage.id, value as ContactMessageStatus)}
                  >
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">🔴 Baru</SelectItem>
                      <SelectItem value="READ">🟡 Dibaca</SelectItem>
                      <SelectItem value="REPLIED">🟢 Dibalas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sender Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nama</p>
                        <p className="font-semibold text-foreground">{selectedMessage.name}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <EnvelopeSimple size={20} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a 
                          href={`mailto:${selectedMessage.email}`}
                          className="font-semibold text-primary hover:underline truncate block"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Phone size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Telepon/WA</p>
                        <a 
                          href={`tel:${selectedMessage.phone}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Calendar size={20} className="text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dikirim pada</p>
                        <p className="font-semibold text-foreground">
                          {format(new Date(selectedMessage.createdAt), 'd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Subjek</p>
                  <p className="text-lg font-bold text-foreground">{selectedMessage.subject}</p>
                </div>

                {/* Message Content */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Pesan</p>
                  <Card className="p-4 bg-muted/30">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`, '_blank')}
                    className="gap-2"
                  >
                    <EnvelopeSimple size={16} />
                    Balas via Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="gap-2"
                  >
                    <Phone size={16} />
                    Hubungi via WA
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
            <Button 
              variant="destructive" 
              onClick={() => {
                setDeleteMessageId(selectedMessage?.id || null)
                setIsViewDialogOpen(false)
              }}
              className="gap-2"
            >
              <Trash size={16} />
              Hapus Pesan
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesan ini akan dihapus secara permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
