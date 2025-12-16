import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Enrollment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClipboardText, Eye } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function EnrollmentsPage() {
  const [enrollments] = useKV<Enrollment[]>('enrollments', [])
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'SD' | 'SMP' | 'SMK'>('ALL')

  const sortedEnrollments = [...(enrollments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const filteredEnrollments = filter === 'ALL'
    ? sortedEnrollments
    : sortedEnrollments.filter(e => e.unit === filter)

  const handleViewDetail = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Menunggu</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-500">Diterima</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge>{status}</Badge>
    }
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
          {filteredEnrollments.length === 0 ? (
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
                          {enrollment.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.parentName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.phone}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(enrollment.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(enrollment.createdAt), 'd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(enrollment)}
                            >
                              <Eye size={18} />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pendaftaran</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nama Lengkap</p>
                  <p className="font-medium">{selectedEnrollment.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">NIK</p>
                  <p className="font-medium">{selectedEnrollment.nik}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tanggal Lahir</p>
                  <p className="font-medium">
                    {format(new Date(selectedEnrollment.birthDate), 'd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unit Pendidikan</p>
                  <Badge variant="outline" className="text-base">
                    {selectedEnrollment.unit} Kasih Ananda
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nama Orang Tua/Wali</p>
                  <p className="font-medium">{selectedEnrollment.parentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nomor HP</p>
                  <p className="font-medium">{selectedEnrollment.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Alamat Lengkap</p>
                <p className="font-medium">{selectedEnrollment.address}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedEnrollment.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tanggal Daftar</p>
                  <p className="font-medium">
                    {format(new Date(selectedEnrollment.createdAt), 'd MMMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
