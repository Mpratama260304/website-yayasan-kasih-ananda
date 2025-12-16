import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Enrollment } from '@/lib/types'
import { generateId } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle, ClipboardText } from '@phosphor-icons/react'

export function PPDBPage() {
  const [enrollments, setEnrollments] = useKV<Enrollment[]>('enrollments', [])
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    birthDate: '',
    unit: '' as 'SD' | 'SMP' | 'SMK' | '',
    parentName: '',
    phone: '',
    address: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap wajib diisi'
    }

    if (!formData.nik.trim()) {
      newErrors.nik = 'NIK wajib diisi'
    } else if (!/^\d{16}$/.test(formData.nik)) {
      newErrors.nik = 'NIK harus 16 digit angka'
    } else {
      const existingEnrollment = (enrollments || []).find(e => e.nik === formData.nik)
      if (existingEnrollment) {
        newErrors.nik = 'NIK sudah terdaftar'
      }
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Tanggal lahir wajib diisi'
    }

    if (!formData.unit) {
      newErrors.unit = 'Unit pendidikan wajib dipilih'
    }

    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Nama orang tua wajib diisi'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor HP wajib diisi'
    } else if (!/^[0-9]{10,13}$/.test(formData.phone)) {
      newErrors.phone = 'Nomor HP tidak valid (10-13 digit)'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field dengan benar')
      return
    }

    const newEnrollment: Enrollment = {
      id: generateId(),
      fullName: formData.fullName,
      nik: formData.nik,
      birthDate: formData.birthDate,
      unit: formData.unit as 'SD' | 'SMP' | 'SMK',
      parentName: formData.parentName,
      phone: formData.phone,
      address: formData.address,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }

    setEnrollments((current) => [...(current || []), newEnrollment])
    toast.success('Pendaftaran berhasil dikirim!')
    setSubmitted(true)
  }

  const handleReset = () => {
    setFormData({
      fullName: '',
      nik: '',
      birthDate: '',
      unit: '',
      parentName: '',
      phone: '',
      address: '',
    })
    setErrors({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Pendaftaran Siswa Baru</h1>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <Card className="max-w-2xl mx-auto p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle size={48} weight="fill" className="text-accent" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Terima kasih telah mendaftar di Yayasan Kasih Ananda. 
                Tim kami akan segera menghubungi Anda untuk proses selanjutnya.
              </p>
              <Button onClick={handleReset} size="lg">
                Daftar Lagi
              </Button>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <ClipboardText size={36} weight="fill" className="text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Pendaftaran Siswa Baru</h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Isi formulir di bawah ini untuk mendaftarkan putra-putri Anda
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap Siswa *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK (Nomor Induk Kependudukan) *</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  className={errors.nik ? 'border-destructive' : ''}
                />
                {errors.nik && (
                  <p className="text-sm text-destructive">{errors.nik}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className={errors.birthDate ? 'border-destructive' : ''}
                />
                {errors.birthDate && (
                  <p className="text-sm text-destructive">{errors.birthDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit Pendidikan *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value as 'SD' | 'SMP' | 'SMK' })}
                >
                  <SelectTrigger id="unit" className={errors.unit ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih unit pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD Kasih Ananda</SelectItem>
                    <SelectItem value="SMP">SMP Kasih Ananda</SelectItem>
                    <SelectItem value="SMK">SMK Kasih Ananda</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-sm text-destructive">{errors.unit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentName">Nama Orang Tua / Wali *</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Masukkan nama orang tua/wali"
                  className={errors.parentName ? 'border-destructive' : ''}
                />
                {errors.parentName && (
                  <p className="text-sm text-destructive">{errors.parentName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP / WhatsApp *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  rows={4}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full">
                  Kirim Pendaftaran
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </div>
  )
}
