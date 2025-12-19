import { useState, useEffect } from 'react'
import { StudentPersonalData, ParentData, RegistrationInfo, PreviousSchoolData, AdditionalInfo, SocialInfo } from '@/lib/types'
import { enrollmentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { CheckCircle, ClipboardText } from '@phosphor-icons/react'

const ACADEMIC_YEARS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029']
const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']
const EDUCATION_LEVELS = ['Tidak Tamat SD', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']
const INCOME_RANGES = [
  'Kurang dari Rp1.000.000',
  'Rp1.000.000 - Rp2.000.000',
  'Rp2.000.000 - Rp5.000.000',
  'Rp5.000.000 - Rp10.000.000',
  'Lebih dari Rp10.000.000'
]
const INFORMATION_SOURCES = ['Google', 'Instagram', 'Facebook', 'Website', 'Spanduk', 'Alumni/Saudara', 'Lainnya']

export function PPDBPageNew() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Registration Info
  const [regInfo, setRegInfo] = useState<RegistrationInfo>({
    academicYear: ACADEMIC_YEARS[0],
    unit: 'SD',
    campus: 'Kampus Utama',
    registrationWave: 'GELOMBANG_1',
    registrationPath: 'REGULER',
    registrationType: 'SISWA_BARU',
  })

  // Student Personal Data
  const [studentData, setStudentData] = useState<StudentPersonalData>({
    fullName: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'LAKI_LAKI',
    religion: 'Islam',
    citizenship: 'WNI',
    dailyLanguage: 'Indonesia',
    childOrder: 1,
    totalSiblings: 0,
  })

  // Previous School
  const [prevSchool, setPrevSchool] = useState<PreviousSchoolData>({
    type: 'SD',
    schoolName: '',
    city: '',
    status: 'NEGERI',
  })

  // Parents Data
  const [parents, setParents] = useState<ParentData[]>([
    {
      type: 'AYAH',
      fullName: '',
      nik: '',
      occupation: '',
      education: '',
      address: '',
      province: '',
      city: '',
      district: '',
      village: '',
      email: '',
      phone: '',
      whatsappActive: true,
      monthlyIncome: '',
    },
    {
      type: 'IBU',
      fullName: '',
      nik: '',
      occupation: '',
      education: '',
      address: '',
      province: '',
      city: '',
      district: '',
      village: '',
      email: '',
      phone: '',
      whatsappActive: true,
      monthlyIncome: '',
    },
  ])

  // Additional Info
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    hasSpecialNeeds: false,
  })

  // Social Info
  const [socialInfo, setSocialInfo] = useState<SocialInfo>({
    willDonate: false,
    willBeFosterParent: false,
    informationSources: [],
  })

  // File uploads
  const [files, setFiles] = useState({
    photo: '',
    birthCertificate: '',
    familyCard: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!studentData.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi'
    if (!studentData.nik.trim()) {
      newErrors.nik = 'NIK wajib diisi'
    } else if (!/^\d{16}$/.test(studentData.nik)) {
      newErrors.nik = 'NIK harus 16 digit angka'
    } else {
      const isDuplicate = await enrollmentsApi.checkNikExists(studentData.nik)
      if (isDuplicate) {
        newErrors.nik = 'NIK sudah terdaftar'
      }
    }

    if (!studentData.birthDate) newErrors.birthDate = 'Tanggal lahir wajib diisi'
    if (!studentData.birthPlace.trim()) newErrors.birthPlace = 'Tempat lahir wajib diisi'

    // Parents validation
    for (let i = 0; i < parents.length; i++) {
      if (!parents[i].fullName.trim()) newErrors[`parent_${i}_name`] = 'Nama wajib diisi'
      if (!parents[i].phone.trim()) newErrors[`parent_${i}_phone`] = 'No. HP wajib diisi'
      if (!parents[i].email.trim()) newErrors[`parent_${i}_email`] = 'Email wajib diisi'
    }

    // Previous school validation
    if (!prevSchool.schoolName.trim()) newErrors.schoolName = 'Nama sekolah asal wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(await validateForm())) {
      toast.error('Mohon lengkapi semua field dengan benar')
      return
    }

    try {
      setIsLoading(true)

      const enrollmentData = {
        // Registration Info
        academicYear: regInfo.academicYear,
        unit: regInfo.unit,
        campus: regInfo.campus,
        registrationWave: regInfo.registrationWave,
        registrationPath: regInfo.registrationPath,
        registrationType: regInfo.registrationType,
        // Student Data
        fullName: studentData.fullName,
        nik: studentData.nik,
        birthPlace: studentData.birthPlace,
        birthDate: studentData.birthDate,
        gender: studentData.gender,
        religion: studentData.religion,
        citizenship: studentData.citizenship,
        dailyLanguage: studentData.dailyLanguage,
        childOrder: studentData.childOrder,
        totalSiblings: studentData.totalSiblings,
        // Previous School
        previousSchoolType: prevSchool.type,
        previousSchoolName: prevSchool.schoolName,
        previousSchoolCity: prevSchool.city,
        previousSchoolStatus: prevSchool.status,
        // Parents as JSON
        parents: JSON.stringify(parents),
        // Additional Info as JSON
        additionalInfo: JSON.stringify(additionalInfo),
        // Social Info as JSON
        socialInfo: JSON.stringify(socialInfo),
        // Files as JSON
        documents: JSON.stringify(files),
      }

      const enrollment = await enrollmentsApi.create(enrollmentData)
      toast.success('Pendaftaran berhasil dikirim!')
      console.log('✅ Enrollment submitted:', enrollment.id)
      setSubmitted(true)
    } catch (error) {
      console.error('❌ Error submitting enrollment:', error)
      toast.error('Gagal mengirim pendaftaran')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle size={80} weight="fill" className="text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Pendaftaran Berhasil!</h1>
              <p className="text-lg text-muted-foreground">
                Terima kasih telah mendaftar di Yayasan Kasih Ananda
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900">
                <strong>Status Pendaftaran:</strong> Menunggu Verifikasi
              </p>
              <p className="text-sm text-blue-900 mt-2">
                Admin kami akan memeriksa data Anda. Kami akan menghubungi Anda melalui WhatsApp atau Email dalam waktu 1-3 hari kerja.
              </p>
            </div>
            <Button size="lg" onClick={() => window.location.href = '/'}>
              Kembali ke Beranda
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="flex justify-center">
              <ClipboardText size={48} weight="duotone" />
            </div>
            <h1 className="text-4xl font-bold">Pendaftaran Peserta Didik Baru (PPDB)</h1>
            <p className="text-xl text-primary-foreground/90">
              Yayasan Kasih Ananda - Tahun Ajaran {regInfo.academicYear}
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Informasi Pendaftaran */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">1. Informasi Pendaftaran</h2>
                <p className="text-muted-foreground">Pilih jenis dan jalur pendaftaran Anda</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tahun Ajaran *</Label>
                  <Select value={regInfo.academicYear} onValueChange={(value) => setRegInfo({ ...regInfo, academicYear: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_YEARS.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Unit Sekolah *</Label>
                  <Select value={regInfo.unit} onValueChange={(value) => setRegInfo({ ...regInfo, unit: value as 'SD' | 'SMP' | 'SMK' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD">SD Kasih Ananda</SelectItem>
                      <SelectItem value="SMP">SMP Kasih Ananda</SelectItem>
                      <SelectItem value="SMK">SMK Kasih Ananda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Gelombang Pendaftaran *</Label>
                  <Select value={regInfo.registrationWave} onValueChange={(value) => setRegInfo({ ...regInfo, registrationWave: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GELOMBANG_1">Gelombang 1</SelectItem>
                      <SelectItem value="GELOMBANG_2">Gelombang 2</SelectItem>
                      <SelectItem value="GELOMBANG_3">Gelombang 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Jalur Pendaftaran *</Label>
                  <Select value={regInfo.registrationPath} onValueChange={(value) => setRegInfo({ ...regInfo, registrationPath: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULER">Reguler</SelectItem>
                      <SelectItem value="PRESTASI">Prestasi</SelectItem>
                      <SelectItem value="MUTASI">Mutasi</SelectItem>
                      <SelectItem value="BEASISWA">Beasiswa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Jenis Pendaftaran *</Label>
                  <Select value={regInfo.registrationType} onValueChange={(value) => setRegInfo({ ...regInfo, registrationType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SISWA_BARU">Siswa Baru</SelectItem>
                      <SelectItem value="PINDAHAN">Pindahan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Section 2: Data Pribadi Calon Siswa */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">2. Data Pribadi Calon Siswa</h2>
                <p className="text-muted-foreground">Masukkan data personal siswa dengan benar</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nama Lengkap *</Label>
                  <Input
                    id="fullName"
                    value={studentData.fullName}
                    onChange={(e) => setStudentData({ ...studentData, fullName: e.target.value })}
                    placeholder="Nama lengkap sesuai akta"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <Label htmlFor="nik">NIK (16 digit) *</Label>
                  <Input
                    id="nik"
                    value={studentData.nik}
                    onChange={(e) => setStudentData({ ...studentData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    placeholder="Nomor Induk Kependudukan"
                    maxLength={16}
                    className={errors.nik ? 'border-red-500' : ''}
                  />
                  {errors.nik && <p className="text-sm text-red-500 mt-1">{errors.nik}</p>}
                </div>

                <div>
                  <Label htmlFor="birthPlace">Tempat Lahir *</Label>
                  <Input
                    id="birthPlace"
                    value={studentData.birthPlace}
                    onChange={(e) => setStudentData({ ...studentData, birthPlace: e.target.value })}
                    placeholder="Kota/Kabupaten lahir"
                    className={errors.birthPlace ? 'border-red-500' : ''}
                  />
                  {errors.birthPlace && <p className="text-sm text-red-500 mt-1">{errors.birthPlace}</p>}
                </div>

                <div>
                  <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={studentData.birthDate}
                    onChange={(e) => setStudentData({ ...studentData, birthDate: e.target.value })}
                    className={errors.birthDate ? 'border-red-500' : ''}
                  />
                  {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
                </div>

                <div>
                  <Label htmlFor="gender">Jenis Kelamin *</Label>
                  <Select value={studentData.gender} onValueChange={(value) => setStudentData({ ...studentData, gender: value as any })}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                      <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="religion">Agama *</Label>
                  <Select value={studentData.religion} onValueChange={(value) => setStudentData({ ...studentData, religion: value })}>
                    <SelectTrigger id="religion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="citizenship">Kewarganegaraan *</Label>
                  <Input
                    id="citizenship"
                    value={studentData.citizenship}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="dailyLanguage">Bahasa Sehari-hari *</Label>
                  <Input
                    id="dailyLanguage"
                    value={studentData.dailyLanguage}
                    onChange={(e) => setStudentData({ ...studentData, dailyLanguage: e.target.value })}
                    placeholder="Bahasa yang digunakan di rumah"
                  />
                </div>

                <div>
                  <Label htmlFor="childOrder">Anak ke- *</Label>
                  <Input
                    id="childOrder"
                    type="number"
                    value={studentData.childOrder}
                    onChange={(e) => setStudentData({ ...studentData, childOrder: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="siblings">Jumlah Saudara Kandung *</Label>
                  <Input
                    id="siblings"
                    type="number"
                    value={studentData.totalSiblings}
                    onChange={(e) => setStudentData({ ...studentData, totalSiblings: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Unggah Dokumen Pendukung</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="photo">Pas Foto (JPG/PNG)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader()
                          reader.onloadend = () => setFiles({ ...files, photo: reader.result as string })
                          reader.readAsDataURL(e.target.files[0])
                        }
                      }}
                      className="mt-2"
                    />
                    {files.photo && <Badge className="mt-2">File terpilih</Badge>}
                  </div>

                  <div>
                    <Label htmlFor="birthCert">Akta Kelahiran (JPG/PNG/PDF)</Label>
                    <Input
                      id="birthCert"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader()
                          reader.onloadend = () => setFiles({ ...files, birthCertificate: reader.result as string })
                          reader.readAsDataURL(e.target.files[0])
                        }
                      }}
                      className="mt-2"
                    />
                    {files.birthCertificate && <Badge className="mt-2">File terpilih</Badge>}
                  </div>

                  <div>
                    <Label htmlFor="familyCard">Kartu Keluarga (JPG/PNG/PDF)</Label>
                    <Input
                      id="familyCard"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader()
                          reader.onloadend = () => setFiles({ ...files, familyCard: reader.result as string })
                          reader.readAsDataURL(e.target.files[0])
                        }
                      }}
                      className="mt-2"
                    />
                    {files.familyCard && <Badge className="mt-2">File terpilih</Badge>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 3: Data Sekolah Asal */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">3. Data Sekolah Asal</h2>
                <p className="text-muted-foreground">Masukkan informasi sekolah sebelumnya</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Sekolah Asal *</Label>
                  <Select value={prevSchool.type} onValueChange={(value) => setPrevSchool({ ...prevSchool, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK">TK/Raudatul Athfal</SelectItem>
                      <SelectItem value="SD">SD/Madrasah Ibtidaiyah</SelectItem>
                      <SelectItem value="SMP">SMP/Madrasah Tsanawiyah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schoolName">Nama Sekolah Asal *</Label>
                  <Input
                    id="schoolName"
                    value={prevSchool.schoolName}
                    onChange={(e) => setPrevSchool({ ...prevSchool, schoolName: e.target.value })}
                    placeholder="Nama lengkap sekolah"
                    className={errors.schoolName ? 'border-red-500' : ''}
                  />
                  {errors.schoolName && <p className="text-sm text-red-500 mt-1">{errors.schoolName}</p>}
                </div>

                <div>
                  <Label htmlFor="schoolCity">Kota Sekolah Asal *</Label>
                  <Input
                    id="schoolCity"
                    value={prevSchool.city}
                    onChange={(e) => setPrevSchool({ ...prevSchool, city: e.target.value })}
                    placeholder="Kota/Kabupaten"
                  />
                </div>

                <div>
                  <Label>Status Sekolah *</Label>
                  <Select value={prevSchool.status} onValueChange={(value) => setPrevSchool({ ...prevSchool, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEGERI">Negeri</SelectItem>
                      <SelectItem value="SWASTA">Swasta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Section 4: Data Orang Tua/Wali */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">4. Data Orang Tua / Wali</h2>
                <p className="text-muted-foreground">Masukkan data orang tua/wali yang akurat</p>
              </div>

              {parents.map((parent, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg">
                    {parent.type === 'AYAH' ? 'Data Ayah' : 'Data Ibu'}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Lengkap *</Label>
                      <Input
                        value={parent.fullName}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, fullName: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Nama lengkap"
                        className={errors[`parent_${idx}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`parent_${idx}_name`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`parent_${idx}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>NIK *</Label>
                      <Input
                        value={parent.nik}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }
                          setParents(updated)
                        }}
                        placeholder="Nomor Induk Kependudukan"
                        maxLength={16}
                      />
                    </div>

                    <div>
                      <Label>Pekerjaan *</Label>
                      <Input
                        value={parent.occupation}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, occupation: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Pekerjaan/Profesi"
                      />
                    </div>

                    <div>
                      <Label>Pendidikan Terakhir *</Label>
                      <Select 
                        value={parent.education} 
                        onValueChange={(value) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, education: value }
                          setParents(updated)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Email Aktif *</Label>
                      <Input
                        type="email"
                        value={parent.email}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, email: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="email@example.com"
                        className={errors[`parent_${idx}_email`] ? 'border-red-500' : ''}
                      />
                      {errors[`parent_${idx}_email`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`parent_${idx}_email`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Nomor HP (WhatsApp) *</Label>
                      <Input
                        value={parent.phone}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, phone: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Nomor WhatsApp aktif"
                        className={errors[`parent_${idx}_phone`] ? 'border-red-500' : ''}
                      />
                      {errors[`parent_${idx}_phone`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`parent_${idx}_phone`]}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Alamat Lengkap *</Label>
                      <Textarea
                        value={parent.address}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, address: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Alamat lengkap sesuai KTP"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Provinsi *</Label>
                      <Input
                        value={parent.province}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, province: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Provinsi"
                      />
                    </div>

                    <div>
                      <Label>Kabupaten/Kota *</Label>
                      <Input
                        value={parent.city}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, city: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Kabupaten/Kota"
                      />
                    </div>

                    <div>
                      <Label>Kecamatan *</Label>
                      <Input
                        value={parent.district}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, district: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Kecamatan"
                      />
                    </div>

                    <div>
                      <Label>Desa/Kelurahan *</Label>
                      <Input
                        value={parent.village}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, village: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Desa/Kelurahan"
                      />
                    </div>

                    <div>
                      <Label>Penghasilan Bulanan *</Label>
                      <Select 
                        value={parent.monthlyIncome} 
                        onValueChange={(value) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, monthlyIncome: value }
                          setParents(updated)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih range penghasilan" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCOME_RANGES.map(range => (
                            <SelectItem key={range} value={range}>{range}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`whatsapp_${idx}`}
                        checked={parent.whatsappActive}
                        onCheckedChange={(checked) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, whatsappActive: checked as boolean }
                          setParents(updated)
                        }}
                      />
                      <Label htmlFor={`whatsapp_${idx}`} className="font-normal">
                        No. HP aktif di WhatsApp
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Section 5: Informasi Tambahan */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">5. Informasi Tambahan</h2>
                <p className="text-muted-foreground">Informasi kesehatan dan kebutuhan khusus</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="specialNeeds"
                    checked={additionalInfo.hasSpecialNeeds}
                    onCheckedChange={(checked) => setAdditionalInfo({ ...additionalInfo, hasSpecialNeeds: checked as boolean })}
                  />
                  <Label htmlFor="specialNeeds" className="font-normal">
                    Apakah anak memiliki kebutuhan khusus?
                  </Label>
                </div>

                <div>
                  <Label htmlFor="medicalHistory">Riwayat Penyakit Penting</Label>
                  <Textarea
                    id="medicalHistory"
                    value={additionalInfo.medicalHistory || ''}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, medicalHistory: e.target.value })}
                    placeholder="Sebutkan penyakit atau kondisi kesehatan yang perlu diketahui (opsional)"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Alergi</Label>
                  <Textarea
                    id="allergies"
                    value={additionalInfo.allergies || ''}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, allergies: e.target.value })}
                    placeholder="Sebutkan alergi makanan atau obat-obatan (opsional)"
                    rows={2}
                  />
                </div>
              </div>
            </Card>

            {/* Section 6: Kesediaan & Informasi Sosial */}
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">6. Kesediaan & Informasi Sosial (Opsional)</h2>
                <p className="text-muted-foreground">Informasi tambahan untuk membantu kami melayani lebih baik</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="donate"
                    checked={socialInfo.willDonate}
                    onCheckedChange={(checked) => setSocialInfo({ ...socialInfo, willDonate: checked as boolean })}
                  />
                  <Label htmlFor="donate" className="font-normal">
                    Kesediaan memberikan infaq/donasi untuk program sekolah
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fosterParent"
                    checked={socialInfo.willBeFosterParent}
                    onCheckedChange={(checked) => setSocialInfo({ ...socialInfo, willBeFosterParent: checked as boolean })}
                  />
                  <Label htmlFor="fosterParent" className="font-normal">
                    Kesediaan menjadi orang tua asuh untuk siswa yang membutuhkan
                  </Label>
                </div>

                <div>
                  <Label>Bagaimana Anda mengetahui pendaftaran di Yayasan Kasih Ananda?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {INFORMATION_SOURCES.map(source => (
                      <div key={source} className="flex items-center gap-2">
                        <Checkbox
                          id={source}
                          checked={socialInfo.informationSources?.includes(source) || false}
                          onCheckedChange={(checked) => {
                            const sources = socialInfo.informationSources || []
                            if (checked) {
                              sources.push(source)
                            } else {
                              sources.splice(sources.indexOf(source), 1)
                            }
                            setSocialInfo({ ...socialInfo, informationSources: sources })
                          }}
                        />
                        <Label htmlFor={source} className="font-normal">{source}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit Section */}
            <Card className="p-6 bg-blue-50">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Dengan menekan tombol "Kirim Pendaftaran", Anda menyatakan bahwa semua data yang Anda berikan adalah benar dan sah sesuai dengan dokumen resmi yang Anda miliki.
                </p>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </section>
    </div>
  )
}
