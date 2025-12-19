import { useState, useEffect } from 'react'
import { Enrollment, ParentData } from '@/lib/api'
import { enrollmentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ClipboardText, Eye, Check, X, Trash, User, Users, MapPin, 
  FileText, Image, Download, GraduationCap, Calendar, Phone, 
  Envelope, House, IdentificationCard, CaretDown, CaretUp
} from '@phosphor-icons/react'
import { format, isValid, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

// ============================================
// SAFE HELPERS - Never crash on invalid data
// ============================================

function safeFormatDate(
  value: string | number | Date | null | undefined,
  formatStr: string = 'd MMMM yyyy',
  fallback: string = '-'
): string {
  try {
    if (!value) return fallback
    let date: Date
    if (value instanceof Date) {
      date = value
    } else if (typeof value === 'string') {
      date = parseISO(value)
      if (!isValid(date)) {
        date = new Date(value)
      }
    } else {
      date = new Date(value)
    }
    if (!isValid(date)) return fallback
    return format(date, formatStr, { locale: id })
  } catch {
    return fallback
  }
}

function safeGetTime(value: string | number | Date | null | undefined): number {
  try {
    if (!value) return 0
    const date = new Date(value)
    return isValid(date) ? date.getTime() : 0
  } catch {
    return 0
  }
}

function safeString(value: any, fallback: string = '-'): string {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function safeBool(value: any): boolean {
  return value === true
}

// ============================================
// DATA ACCESSORS - Handle both old and new schema
// ============================================

function getStudentName(e: Enrollment): string {
  if (e.studentData?.fullName) return e.studentData.fullName
  if ((e as any).fullName) return (e as any).fullName
  return '-'
}

function getStudentNIK(e: Enrollment): string {
  if (e.studentData?.nik) return e.studentData.nik
  if ((e as any).nik) return (e as any).nik
  return '-'
}

function getStudentBirthDate(e: Enrollment): string {
  if (e.studentData?.birthDate) return e.studentData.birthDate
  if ((e as any).birthDate) return (e as any).birthDate
  return ''
}

function getStudentBirthPlace(e: Enrollment): string {
  if (e.studentData?.birthPlace) return e.studentData.birthPlace
  return '-'
}

function getUnit(e: Enrollment): string {
  if (e.registrationInfo?.unit) return e.registrationInfo.unit
  if ((e as any).unit) return (e as any).unit
  return '-'
}

function getParentName(e: Enrollment): string {
  if (e.parents && e.parents.length > 0) {
    const father = e.parents.find(p => p.type === 'AYAH')
    if (father?.fullName) return father.fullName
    if (e.parents[0]?.fullName) return e.parents[0].fullName
  }
  if ((e as any).parentName) return (e as any).parentName
  return '-'
}

function getParentPhone(e: Enrollment): string {
  if (e.parents && e.parents.length > 0) {
    const father = e.parents.find(p => p.type === 'AYAH')
    if (father?.phone) return father.phone
    if (e.parents[0]?.phone) return e.parents[0].phone
  }
  if ((e as any).phone) return (e as any).phone
  return '-'
}

function getAddress(e: Enrollment): string {
  if (e.parents && e.parents.length > 0) {
    const parent = e.parents[0]
    if (parent?.address) {
      const parts = [parent.address, parent.village, parent.district, parent.city, parent.province].filter(Boolean)
      return parts.join(', ') || '-'
    }
  }
  if ((e as any).address) return (e as any).address
  return '-'
}

// ============================================
// COMPONENT
// ============================================

export function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'SD' | 'SMP' | 'SMK'>('ALL')
  const [deleteEnrollment, setDeleteEnrollment] = useState<Enrollment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    student: true,
    registration: true,
    parents: true,
    school: false,
    additional: false,
    documents: true,
  })

  useEffect(() => {
    loadEnrollments()
  }, [])

  const loadEnrollments = async () => {
    try {
      setIsLoading(true)
      const allEnrollments = await enrollmentsApi.getAll()
      setEnrollments(allEnrollments || [])
      console.log('✅ Enrollments loaded:', allEnrollments.length)
    } catch (error) {
      console.error('❌ Error loading enrollments:', error)
      toast.error('Gagal memuat data pendaftaran')
    } finally {
      setIsLoading(false)
    }
  }

  const sortedEnrollments = [...enrollments].sort(
    (a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt)
  )

  const filteredEnrollments = filter === 'ALL'
    ? sortedEnrollments
    : sortedEnrollments.filter(e => getUnit(e) === filter)

  const handleViewDetail = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (enrollmentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const updatedEnrollment = await enrollmentsApi.updateStatus(enrollmentId, newStatus)
      const updated = enrollments.map(e => 
        e.id === enrollmentId ? updatedEnrollment : e
      )
      setEnrollments(updated)
      if (selectedEnrollment?.id === enrollmentId) {
        setSelectedEnrollment(updatedEnrollment)
      }
      toast.success(`Pendaftaran ${newStatus === 'APPROVED' ? 'diterima' : 'ditolak'}`)
    } catch (error) {
      console.error('❌ Error updating status:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!deleteEnrollment) return
    try {
      setIsDeleting(true)
      await enrollmentsApi.delete(deleteEnrollment.id)
      setEnrollments(enrollments.filter(e => e.id !== deleteEnrollment.id))
      if (selectedEnrollment?.id === deleteEnrollment.id) {
        setDialogOpen(false)
        setSelectedEnrollment(null)
      }
      toast.success('Data pendaftaran berhasil dihapus')
    } catch (error) {
      console.error('❌ Error deleting enrollment:', error)
      toast.error('Gagal menghapus data pendaftaran')
    } finally {
      setIsDeleting(false)
      setDeleteEnrollment(null)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Menunggu</Badge>
      case 'VERIFIED':
        return <Badge className="bg-blue-500">Terverifikasi</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-500">Diterima</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge>{status || '-'}</Badge>
    }
  }

  // ============================================
  // DETAIL SECTION COMPONENTS
  // ============================================

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section
  }: { 
    title: string
    icon: any
    section: string
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-primary" weight="duotone" />
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      {expandedSections[section] ? <CaretUp size={18} /> : <CaretDown size={18} />}
    </button>
  )

  const DataField = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '-'}</p>
    </div>
  )

  const renderParentSection = (parent: ParentData, index: number) => {
    const typeLabel = parent.type === 'AYAH' ? 'Data Ayah' : parent.type === 'IBU' ? 'Data Ibu' : `Orang Tua ${index + 1}`
    return (
      <div key={index} className="space-y-3 p-3 bg-muted/30 rounded-lg">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <User size={16} />
          {typeLabel}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <DataField label="Nama Lengkap" value={safeString(parent.fullName)} />
          <DataField label="NIK" value={safeString(parent.nik)} />
          <DataField label="Pekerjaan" value={safeString(parent.occupation)} />
          <DataField label="Pendidikan" value={safeString(parent.education)} />
          <DataField label="Email" value={safeString(parent.email)} />
          <DataField label="No. HP" value={safeString(parent.phone)} />
          <DataField label="WhatsApp Aktif" value={safeBool(parent.whatsappActive) ? 'Ya' : 'Tidak'} />
          <DataField label="Penghasilan" value={safeString(parent.monthlyIncome)} />
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Alamat</p>
          <p className="text-sm">
            {[parent.address, parent.village, parent.district, parent.city, parent.province]
              .filter(Boolean).join(', ') || '-'}
          </p>
        </div>
      </div>
    )
  }

  const renderDocumentLink = (path: string | undefined, label: string) => {
    if (!path) return <span className="text-muted-foreground text-sm">Tidak diunggah</span>
    
    if (path.startsWith('data:')) {
      return (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(path, '_blank')}>
          <Image size={16} />
          Lihat {label}
        </Button>
      )
    }
    
    return (
      <Button variant="outline" size="sm" className="gap-2" asChild>
        <a href={path} target="_blank" rel="noopener noreferrer">
          <Download size={16} />
          Download {label}
        </a>
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Pendaftaran</h1>
        <p className="text-muted-foreground">Kelola data pendaftaran siswa baru (PPDB)</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="ALL">Semua</TabsTrigger>
          <TabsTrigger value="SD">SD</TabsTrigger>
          <TabsTrigger value="SMP">SMP</TabsTrigger>
          <TabsTrigger value="SMK">SMK</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse">
                <ClipboardText size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Memuat Data...</h3>
              <p className="text-muted-foreground">Mengambil data pendaftaran dari database</p>
            </Card>
          ) : filteredEnrollments.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ClipboardText size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Belum Ada Pendaftaran</h3>
              <p className="text-muted-foreground">
                Data pendaftaran akan muncul di sini setelah ada yang mendaftar
              </p>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Orang Tua</TableHead>
                      <TableHead>No. HP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {getStudentName(enrollment)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getUnit(enrollment)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getParentName(enrollment)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getParentPhone(enrollment)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(enrollment.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {safeFormatDate(enrollment.createdAt, 'd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(enrollment)}
                            >
                              <Eye size={18} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteEnrollment(enrollment)}
                              disabled={isDeleting}
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
        </TabsContent>
      </Tabs>

      {/* DETAIL DIALOG - FULL DATA VIEW */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardText size={24} className="text-primary" />
              Detail Pendaftaran PPDB
            </DialogTitle>
          </DialogHeader>

          {selectedEnrollment && (
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="space-y-4 pb-6">
                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      {getStatusBadge(selectedEnrollment.status)}
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Daftar</p>
                      <p className="font-medium">{safeFormatDate(selectedEnrollment.createdAt, 'd MMMM yyyy HH:mm')}</p>
                    </div>
                  </div>
                  {selectedEnrollment.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(selectedEnrollment.id, 'APPROVED')}
                      >
                        <Check size={16} />
                        Terima
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleUpdateStatus(selectedEnrollment.id, 'REJECTED')}
                      >
                        <X size={16} />
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>

                {/* SECTION: Registration Info */}
                <div className="space-y-3">
                  <SectionHeader title="Informasi Pendaftaran" icon={GraduationCap} section="registration" />
                  {expandedSections.registration && selectedEnrollment.registrationInfo && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-muted/20 rounded-lg">
                      <DataField label="Tahun Ajaran" value={safeString(selectedEnrollment.registrationInfo.academicYear)} />
                      <DataField label="Unit Sekolah" value={safeString(selectedEnrollment.registrationInfo.unit)} />
                      <DataField label="Kampus" value={safeString(selectedEnrollment.registrationInfo.campus)} />
                      <DataField label="Gelombang" value={safeString(selectedEnrollment.registrationInfo.registrationWave)?.replace('_', ' ')} />
                      <DataField label="Jalur" value={safeString(selectedEnrollment.registrationInfo.registrationPath)} />
                      <DataField label="Jenis" value={safeString(selectedEnrollment.registrationInfo.registrationType)?.replace('_', ' ')} />
                    </div>
                  )}
                </div>

                {/* SECTION: Student Data */}
                <div className="space-y-3">
                  <SectionHeader title="Data Pribadi Siswa" icon={User} section="student" />
                  {expandedSections.student && (
                    <div className="p-3 bg-muted/20 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DataField label="Nama Lengkap" value={getStudentName(selectedEnrollment)} />
                        <DataField label="NIK" value={getStudentNIK(selectedEnrollment)} />
                        <DataField label="Tempat Lahir" value={getStudentBirthPlace(selectedEnrollment)} />
                        <DataField label="Tanggal Lahir" value={safeFormatDate(getStudentBirthDate(selectedEnrollment))} />
                        <DataField label="Jenis Kelamin" value={
                          selectedEnrollment.studentData?.gender === 'LAKI_LAKI' ? 'Laki-laki' :
                          selectedEnrollment.studentData?.gender === 'PEREMPUAN' ? 'Perempuan' : '-'
                        } />
                        <DataField label="Agama" value={safeString(selectedEnrollment.studentData?.religion)} />
                        <DataField label="Kewarganegaraan" value={safeString(selectedEnrollment.studentData?.citizenship)} />
                        <DataField label="Bahasa Sehari-hari" value={safeString(selectedEnrollment.studentData?.dailyLanguage)} />
                        <DataField label="Anak Ke" value={safeString(selectedEnrollment.studentData?.childOrder)} />
                        <DataField label="Jumlah Saudara" value={safeString(selectedEnrollment.studentData?.totalSiblings)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION: Parents Data */}
                <div className="space-y-3">
                  <SectionHeader title="Data Orang Tua" icon={Users} section="parents" />
                  {expandedSections.parents && (
                    <div className="space-y-3">
                      {selectedEnrollment.parents && selectedEnrollment.parents.length > 0 ? (
                        selectedEnrollment.parents.map((parent, idx) => renderParentSection(parent, idx))
                      ) : (
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <DataField label="Nama Orang Tua" value={getParentName(selectedEnrollment)} />
                            <DataField label="No. HP" value={getParentPhone(selectedEnrollment)} />
                            <div className="col-span-2">
                              <DataField label="Alamat" value={getAddress(selectedEnrollment)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION: Previous School */}
                <div className="space-y-3">
                  <SectionHeader title="Asal Sekolah" icon={House} section="school" />
                  {expandedSections.school && selectedEnrollment.previousSchool && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/20 rounded-lg">
                      <DataField label="Jenis" value={safeString(selectedEnrollment.previousSchool.type)} />
                      <DataField label="Nama Sekolah" value={safeString(selectedEnrollment.previousSchool.schoolName)} />
                      <DataField label="Kota" value={safeString(selectedEnrollment.previousSchool.city)} />
                      <DataField label="Status" value={safeString(selectedEnrollment.previousSchool.status)} />
                    </div>
                  )}
                </div>

                {/* SECTION: Additional Info */}
                <div className="space-y-3">
                  <SectionHeader title="Informasi Tambahan" icon={FileText} section="additional" />
                  {expandedSections.additional && (
                    <div className="p-3 bg-muted/20 rounded-lg space-y-4">
                      {selectedEnrollment.additionalInfo && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <DataField label="Berkebutuhan Khusus" value={safeBool(selectedEnrollment.additionalInfo.hasSpecialNeeds) ? 'Ya' : 'Tidak'} />
                          <DataField label="Riwayat Medis" value={safeString(selectedEnrollment.additionalInfo.medicalHistory)} />
                          <DataField label="Alergi" value={safeString(selectedEnrollment.additionalInfo.allergies)} />
                        </div>
                      )}
                      {selectedEnrollment.socialInfo && (
                        <div className="pt-3 border-t">
                          <h4 className="text-sm font-semibold mb-3">Info Sosial</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DataField label="Bersedia Donasi" value={safeBool(selectedEnrollment.socialInfo.willDonate) ? 'Ya' : 'Tidak'} />
                            <DataField label="Bersedia Orang Tua Asuh" value={safeBool(selectedEnrollment.socialInfo.willBeFosterParent) ? 'Ya' : 'Tidak'} />
                            <DataField 
                              label="Sumber Informasi" 
                              value={selectedEnrollment.socialInfo.informationSources?.join(', ') || '-'} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION: Documents */}
                <div className="space-y-3">
                  <SectionHeader title="Dokumen yang Diunggah" icon={Image} section="documents" />
                  {expandedSections.documents && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Pas Foto</p>
                          {renderDocumentLink(selectedEnrollment.studentData?.photoPath, 'Foto')}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Akta Kelahiran</p>
                          {renderDocumentLink(selectedEnrollment.studentData?.birthCertificatePath, 'Akta')}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Kartu Keluarga</p>
                          {renderDocumentLink(selectedEnrollment.studentData?.familyCardPath, 'KK')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Guardian (if exists) */}
                {selectedEnrollment.guardian && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
                      <User size={20} className="text-amber-600" weight="duotone" />
                      <span className="font-semibold text-foreground">Data Wali (Selain Orang Tua)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/20 rounded-lg">
                      <DataField label="Nama Wali" value={safeString(selectedEnrollment.guardian.name)} />
                      <DataField label="Hubungan" value={safeString(selectedEnrollment.guardian.relationship)} />
                      <DataField label="No. HP" value={safeString(selectedEnrollment.guardian.phone)} />
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedEnrollment.reviewNotes && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-semibold mb-1">Catatan Review</p>
                    <p className="text-sm text-yellow-900">{selectedEnrollment.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEnrollment} onOpenChange={() => setDeleteEnrollment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus data pendaftaran "{deleteEnrollment ? getStudentName(deleteEnrollment) : ''}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEnrollment} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
