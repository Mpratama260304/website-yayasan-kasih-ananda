import { useState, useEffect } from 'react'
import { StudentPersonalData, ParentData, RegistrationInfo, PreviousSchoolData, AdditionalInfo, SocialInfo } from '@/lib/types'
import { settingsApi, enrollmentsApi, GlobalSettings } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { CheckCircle, ClipboardText, XCircle, Info } from '@phosphor-icons/react'

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

export function PPDBPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

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

  // Load CMS settings to check PPDB status
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsCheckingStatus(true)
        const cmsSettings = await settingsApi.get()
        setSettings(cmsSettings)
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }
    loadSettings()
  }, [])

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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-2xl">
          <Card className="p-8 md:p-12 text-center space-y-6 shadow-lg">
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={80} weight="fill" className="text-green-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Pendaftaran Berhasil!</h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Terima kasih telah mendaftar di Yayasan Kasih Ananda
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 md:p-6 text-left space-y-2">
              <p className="text-sm md:text-base text-blue-900 font-semibold">
                Status Pendaftaran: <span className="text-blue-600">Menunggu Verifikasi</span>
              </p>
              <p className="text-sm md:text-base text-blue-800 leading-relaxed">
                Admin kami akan memeriksa data Anda dalam waktu 1-3 hari kerja. Kami akan menghubungi Anda melalui WhatsApp atau Email yang Anda berikan.
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={() => window.location.href = '/'}
              className="w-full md:w-auto px-8 py-6 md:py-8 text-base md:text-lg"
            >
              Kembali ke Beranda
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // Loading status check
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-2xl">
          <Card className="p-8 md:p-12 text-center space-y-6 shadow-lg">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Memuat informasi pendaftaran...</p>
          </Card>
        </div>
      </div>
    )
  }

  // PPDB Closed
  if (settings && !settings.ppdbOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-2xl">
          <Card className="p-8 md:p-12 text-center space-y-6 shadow-lg">
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={80} weight="fill" className="text-red-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Pendaftaran Ditutup</h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {settings.ppdbClosedMessage || 'Mohon maaf, pendaftaran peserta didik baru saat ini sedang ditutup.'}
              </p>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 md:p-6 text-left space-y-3">
              <div className="flex items-start gap-3">
                <Info size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-amber-900 font-semibold">
                    Informasi Pendaftaran
                  </p>
                  <p className="text-sm md:text-base text-amber-800 leading-relaxed">
                    Silakan hubungi kami untuk informasi lebih lanjut mengenai jadwal pendaftaran berikutnya atau informasi lainnya.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(settings.contactPhone || settings.contactEmail || settings.contactWhatsapp) && (
              <div className="bg-muted/50 rounded-lg p-4 md:p-6 text-left space-y-2">
                <p className="font-semibold text-foreground mb-3">Hubungi Kami:</p>
                {settings.contactPhone && (
                  <p className="text-sm text-muted-foreground">
                    📞 Telepon: <a href={`tel:${settings.contactPhone}`} className="text-primary hover:underline">{settings.contactPhone}</a>
                  </p>
                )}
                {settings.contactWhatsapp && (
                  <p className="text-sm text-muted-foreground">
                    💬 WhatsApp: <a href={`https://wa.me/${settings.contactWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{settings.contactWhatsapp}</a>
                  </p>
                )}
                {settings.contactEmail && (
                  <p className="text-sm text-muted-foreground">
                    ✉️ Email: <a href={`mailto:${settings.contactEmail}`} className="text-primary hover:underline">{settings.contactEmail}</a>
                  </p>
                )}
              </div>
            )}

            <Button 
              size="lg" 
              onClick={() => window.location.href = '/'}
              className="w-full md:w-auto px-8 py-6 md:py-8 text-base md:text-lg"
            >
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
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-8 md:py-12 lg:py-16 shadow-md">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <div className="flex justify-center mb-2">
              <ClipboardText size={40} weight="duotone" className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Pendaftaran Peserta Didik Baru
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 leading-relaxed">
              Yayasan Kasih Ananda - Tahun Ajaran {regInfo.academicYear}
            </p>
            <p className="text-sm md:text-base text-primary-foreground/80 max-w-2xl mx-auto">
              Isi formulir berikut dengan data yang akurat dan lengkap
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Section 1: Informasi Pendaftaran */}
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">1. Informasi Pendaftaran</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Pilih jenis dan jalur pendaftaran Anda</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Tahun Ajaran *</Label>
                  <Select value={regInfo.academicYear} onValueChange={(value) => setRegInfo({ ...regInfo, academicYear: value })}>
                    <SelectTrigger className="h-11 md:h-12">
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
                  <Label className="text-base font-semibold mb-2 block">Unit Sekolah *</Label>
                  <Select value={regInfo.unit} onValueChange={(value) => setRegInfo({ ...regInfo, unit: value as 'SD' | 'SMP' | 'SMK' })}>
                    <SelectTrigger className="h-11 md:h-12">
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
                  <Label className="text-base font-semibold mb-2 block">Gelombang Pendaftaran *</Label>
                  <Select value={regInfo.registrationWave} onValueChange={(value) => setRegInfo({ ...regInfo, registrationWave: value as any })}>
                    <SelectTrigger className="h-11 md:h-12">
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
                  <Label className="text-base font-semibold mb-2 block">Jalur Pendaftaran *</Label>
                  <Select value={regInfo.registrationPath} onValueChange={(value) => setRegInfo({ ...regInfo, registrationPath: value as any })}>
                    <SelectTrigger className="h-11 md:h-12">
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
                  <Label className="text-base font-semibold mb-2 block">Jenis Pendaftaran *</Label>
                  <Select value={regInfo.registrationType} onValueChange={(value) => setRegInfo({ ...regInfo, registrationType: value as any })}>
                    <SelectTrigger className="h-11 md:h-12">
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
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">2. Data Pribadi Calon Siswa</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Masukkan data personal siswa dengan benar</p>
              </div>

              <div className="space-y-6">
                {/* Personal Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <Label htmlFor="fullName" className="text-base font-semibold mb-2 block">Nama Lengkap *</Label>
                    <Input
                      id="fullName"
                      value={studentData.fullName}
                      onChange={(e) => setStudentData({ ...studentData, fullName: e.target.value })}
                      placeholder="Sesuai akta lahir"
                      className={`h-11 md:h-12 ${errors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.fullName && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="nik" className="text-base font-semibold mb-2 block">NIK (16 digit) *</Label>
                    <Input
                      id="nik"
                      value={studentData.nik}
                      onChange={(e) => setStudentData({ ...studentData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                      placeholder="Nomor Induk Kependudukan"
                      maxLength={16}
                      className={`h-11 md:h-12 ${errors.nik ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.nik && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.nik}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthPlace" className="text-base font-semibold mb-2 block">Tempat Lahir *</Label>
                    <Input
                      id="birthPlace"
                      value={studentData.birthPlace}
                      onChange={(e) => setStudentData({ ...studentData, birthPlace: e.target.value })}
                      placeholder="Kota/Kabupaten"
                      className={`h-11 md:h-12 ${errors.birthPlace ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.birthPlace && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.birthPlace}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthDate" className="text-base font-semibold mb-2 block">Tanggal Lahir *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={studentData.birthDate}
                      onChange={(e) => setStudentData({ ...studentData, birthDate: e.target.value })}
                      className={`h-11 md:h-12 ${errors.birthDate ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.birthDate && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.birthDate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-base font-semibold mb-2 block">Jenis Kelamin *</Label>
                    <Select value={studentData.gender} onValueChange={(value) => setStudentData({ ...studentData, gender: value as any })}>
                      <SelectTrigger id="gender" className="h-11 md:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                        <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="religion" className="text-base font-semibold mb-2 block">Agama *</Label>
                    <Select value={studentData.religion} onValueChange={(value) => setStudentData({ ...studentData, religion: value })}>
                      <SelectTrigger id="religion" className="h-11 md:h-12">
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
                    <Label htmlFor="citizenship" className="text-base font-semibold mb-2 block">Kewarganegaraan *</Label>
                    <Input
                      id="citizenship"
                      value={studentData.citizenship}
                      readOnly
                      disabled
                      className="h-11 md:h-12 bg-muted"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dailyLanguage" className="text-base font-semibold mb-2 block">Bahasa Sehari-hari *</Label>
                    <Input
                      id="dailyLanguage"
                      value={studentData.dailyLanguage}
                      onChange={(e) => setStudentData({ ...studentData, dailyLanguage: e.target.value })}
                      placeholder="Bahasa di rumah"
                      className="h-11 md:h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="childOrder" className="text-base font-semibold mb-2 block">Anak ke- *</Label>
                    <Input
                      id="childOrder"
                      type="number"
                      value={studentData.childOrder}
                      onChange={(e) => setStudentData({ ...studentData, childOrder: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="h-11 md:h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="siblings" className="text-base font-semibold mb-2 block">Jumlah Saudara Kandung *</Label>
                    <Input
                      id="siblings"
                      type="number"
                      value={studentData.totalSiblings}
                      onChange={(e) => setStudentData({ ...studentData, totalSiblings: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="h-11 md:h-12"
                    />
                  </div>
                </div>

                {/* File Uploads Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Unggah Dokumen Pendukung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="photo" className="text-base font-semibold">Pas Foto (JPG/PNG)</Label>
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
                        className="h-11 md:h-12 text-sm"
                      />
                      {files.photo && <Badge className="mt-2 text-xs md:text-sm py-1">✓ File terpilih</Badge>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthCert" className="text-base font-semibold">Akta Kelahiran (JPG/PNG/PDF)</Label>
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
                        className="h-11 md:h-12 text-sm"
                      />
                      {files.birthCertificate && <Badge className="mt-2 text-xs md:text-sm py-1">✓ File terpilih</Badge>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="familyCard" className="text-base font-semibold">Kartu Keluarga (JPG/PNG/PDF)</Label>
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
                        className="h-11 md:h-12 text-sm"
                      />
                      {files.familyCard && <Badge className="mt-2 text-xs md:text-sm py-1">✓ File terpilih</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 3: Data Sekolah Asal */}
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">3. Data Sekolah Asal</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Masukkan informasi sekolah sebelumnya</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Jenis Sekolah Asal *</Label>
                  <Select value={prevSchool.type} onValueChange={(value) => setPrevSchool({ ...prevSchool, type: value as any })}>
                    <SelectTrigger className="h-11 md:h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK">TK/Raudatul Athfal</SelectItem>
                      <SelectItem value="SD">SD/Madrasah Ibtidaiyah</SelectItem>
                      <SelectItem value="SMP">SMP/Madrasah Tsanawiyah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor="schoolName" className="text-base font-semibold mb-2 block">Nama Sekolah Asal *</Label>
                  <Input
                    id="schoolName"
                    value={prevSchool.schoolName}
                    onChange={(e) => setPrevSchool({ ...prevSchool, schoolName: e.target.value })}
                    placeholder="Nama lengkap sekolah"
                    className={`h-11 md:h-12 ${errors.schoolName ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.schoolName && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.schoolName}</p>}
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor="schoolCity" className="text-base font-semibold mb-2 block">Kota Sekolah Asal *</Label>
                  <Input
                    id="schoolCity"
                    value={prevSchool.city}
                    onChange={(e) => setPrevSchool({ ...prevSchool, city: e.target.value })}
                    placeholder="Kota/Kabupaten"
                    className="h-11 md:h-12"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-2 block">Status Sekolah *</Label>
                  <Select value={prevSchool.status} onValueChange={(value) => setPrevSchool({ ...prevSchool, status: value as any })}>
                    <SelectTrigger className="h-11 md:h-12">
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
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">4. Data Orang Tua / Wali</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Masukkan data orang tua/wali yang akurat</p>
              </div>

              <div className="space-y-6 md:space-y-8">
                {parents.map((parent, idx) => (
                  <div key={idx} className={`border-2 rounded-lg p-4 md:p-6 space-y-4 ${idx === 0 ? 'border-blue-300 bg-blue-50/50' : 'border-pink-300 bg-pink-50/50'}`}>
                    <div className="flex items-center gap-2 pb-4 border-b">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm md:text-base ${idx === 0 ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {idx === 0 ? '👨' : '👩'}
                      </div>
                      <h3 className="font-bold text-lg md:text-xl text-foreground">
                        {parent.type === 'AYAH' ? 'Data Ayah' : 'Data Ibu'}
                      </h3>
                    </div>

                    {/* First Row: Name, NIK, Occupation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Nama Lengkap *</Label>
                        <Input
                          value={parent.fullName}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, fullName: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Nama lengkap"
                          className={`h-11 md:h-12 ${errors[`parent_${idx}_name`] ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors[`parent_${idx}_name`] && (
                          <p className="text-xs md:text-sm text-red-500 mt-1">{errors[`parent_${idx}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">NIK (16 digit) *</Label>
                        <Input
                          value={parent.nik}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }
                            setParents(updated)
                          }}
                          placeholder="Nomor Induk Kependudukan"
                          maxLength={16}
                          className="h-11 md:h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Pekerjaan *</Label>
                        <Input
                          value={parent.occupation}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, occupation: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Pekerjaan/Profesi"
                          className="h-11 md:h-12"
                        />
                      </div>
                    </div>

                    {/* Second Row: Education, Email, Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Pendidikan Terakhir *</Label>
                        <Select 
                          value={parent.education} 
                          onValueChange={(value) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, education: value }
                            setParents(updated)
                          }}
                        >
                          <SelectTrigger className="h-11 md:h-12">
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
                        <Label className="text-base font-semibold mb-2 block">Email Aktif *</Label>
                        <Input
                          type="email"
                          value={parent.email}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, email: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="email@example.com"
                          className={`h-11 md:h-12 ${errors[`parent_${idx}_email`] ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors[`parent_${idx}_email`] && (
                          <p className="text-xs md:text-sm text-red-500 mt-1">{errors[`parent_${idx}_email`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Nomor HP (WhatsApp) *</Label>
                        <Input
                          value={parent.phone}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, phone: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="08xxxxxxxxxx"
                          className={`h-11 md:h-12 ${errors[`parent_${idx}_phone`] ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors[`parent_${idx}_phone`] && (
                          <p className="text-xs md:text-sm text-red-500 mt-1">{errors[`parent_${idx}_phone`]}</p>
                        )}
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">Alamat Lengkap *</Label>
                      <Textarea
                        value={parent.address}
                        onChange={(e) => {
                          const updated = [...parents]
                          updated[idx] = { ...parent, address: e.target.value }
                          setParents(updated)
                        }}
                        placeholder="Alamat lengkap sesuai KTP"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Location Details: Province, City, District, Village */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Provinsi *</Label>
                        <Input
                          value={parent.province}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, province: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Provinsi"
                          className="h-11 md:h-12 text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Kabupaten/Kota *</Label>
                        <Input
                          value={parent.city}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, city: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Kabupaten/Kota"
                          className="h-11 md:h-12 text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Kecamatan *</Label>
                        <Input
                          value={parent.district}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, district: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Kecamatan"
                          className="h-11 md:h-12 text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Desa/Kelurahan *</Label>
                        <Input
                          value={parent.village}
                          onChange={(e) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, village: e.target.value }
                            setParents(updated)
                          }}
                          placeholder="Desa/Kelurahan"
                          className="h-11 md:h-12 text-sm"
                        />
                      </div>
                    </div>

                    {/* Income and WhatsApp Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Penghasilan Bulanan *</Label>
                        <Select 
                          value={parent.monthlyIncome} 
                          onValueChange={(value) => {
                            const updated = [...parents]
                            updated[idx] = { ...parent, monthlyIncome: value }
                            setParents(updated)
                          }}
                        >
                          <SelectTrigger className="h-11 md:h-12">
                            <SelectValue placeholder="Pilih range penghasilan" />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_RANGES.map(range => (
                              <SelectItem key={range} value={range}>{range}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <div className="flex items-center gap-3 w-full p-3 border-2 border-dashed rounded-lg bg-background">
                          <Checkbox
                            id={`whatsapp_${idx}`}
                            checked={parent.whatsappActive}
                            onCheckedChange={(checked) => {
                              const updated = [...parents]
                              updated[idx] = { ...parent, whatsappActive: checked as boolean }
                              setParents(updated)
                            }}
                          />
                          <Label htmlFor={`whatsapp_${idx}`} className="font-normal text-sm md:text-base cursor-pointer">
                            No. HP aktif di WhatsApp
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Section 5: Informasi Tambahan */}
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">5. Informasi Tambahan</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Informasi kesehatan dan kebutuhan khusus</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 border-2 border-dashed rounded-lg bg-orange-50/50">
                  <Checkbox
                    id="specialNeeds"
                    checked={additionalInfo.hasSpecialNeeds}
                    onCheckedChange={(checked) => setAdditionalInfo({ ...additionalInfo, hasSpecialNeeds: checked as boolean })}
                    className="mt-1"
                  />
                  <Label htmlFor="specialNeeds" className="font-semibold text-base md:text-lg cursor-pointer leading-relaxed">
                    Apakah anak memiliki kebutuhan khusus atau kondisi medis yang perlu diperhatikan?
                  </Label>
                </div>

                <div>
                  <Label htmlFor="medicalHistory" className="text-base font-semibold mb-3 block">Riwayat Penyakit Penting</Label>
                  <Textarea
                    id="medicalHistory"
                    value={additionalInfo.medicalHistory || ''}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, medicalHistory: e.target.value })}
                    placeholder="Contoh: asma, diabetes, epilepsi, dll. (opsional)"
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Informasi ini hanya untuk keperluan medis di sekolah</p>
                </div>

                <div>
                  <Label htmlFor="allergies" className="text-base font-semibold mb-3 block">Alergi</Label>
                  <Textarea
                    id="allergies"
                    value={additionalInfo.allergies || ''}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, allergies: e.target.value })}
                    placeholder="Contoh: alergi makanan tertentu, obat-obatan, atau hal lainnya. (opsional)"
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Data penting untuk keselamatan anak di sekolah</p>
                </div>
              </div>
            </Card>

            {/* Section 6: Kesediaan & Informasi Sosial */}
            <Card className="p-4 md:p-6 lg:p-8 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">6. Kesediaan & Informasi Sosial</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Informasi tambahan (opsional) untuk membantu kami melayani lebih baik</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border-2 border-dashed rounded-lg bg-green-50/50">
                    <Checkbox
                      id="donate"
                      checked={socialInfo.willDonate}
                      onCheckedChange={(checked) => setSocialInfo({ ...socialInfo, willDonate: checked as boolean })}
                      className="mt-1"
                    />
                    <Label htmlFor="donate" className="font-semibold text-base md:text-lg cursor-pointer leading-relaxed">
                      Kesediaan memberikan infaq/donasi untuk program sekolah
                    </Label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border-2 border-dashed rounded-lg bg-blue-50/50">
                    <Checkbox
                      id="fosterParent"
                      checked={socialInfo.willBeFosterParent}
                      onCheckedChange={(checked) => setSocialInfo({ ...socialInfo, willBeFosterParent: checked as boolean })}
                      className="mt-1"
                    />
                    <Label htmlFor="fosterParent" className="font-semibold text-base md:text-lg cursor-pointer leading-relaxed">
                      Kesediaan menjadi orang tua asuh untuk siswa kurang mampu yang membutuhkan
                    </Label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label className="text-base font-semibold mb-4 block">Bagaimana Anda mengetahui Yayasan Kasih Ananda?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {INFORMATION_SOURCES.map(source => (
                      <div key={source} className="flex items-center gap-3 p-2 hover:bg-accent/10 rounded transition-colors">
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
                        <Label htmlFor={source} className="font-normal text-sm md:text-base cursor-pointer">{source}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit Section */}
            <Card className="p-4 md:p-6 lg:p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 shadow-md">
              <div className="space-y-4 md:space-y-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 md:p-6 rounded">
                  <p className="text-xs md:text-sm text-yellow-900 leading-relaxed">
                    <strong>Perhatian:</strong> Dengan menekan tombol "Kirim Pendaftaran", Anda menyatakan bahwa semua data yang diberikan adalah benar, akurat, dan sah sesuai dengan dokumen resmi. Pendaftaran yang tidak sesuai dengan dokumen dapat dibatalkan.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 md:h-14 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Memproses...
                    </span>
                  ) : (
                    '✓ Kirim Pendaftaran'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Sistem kami aman dan terenkripsi. Data Anda tidak akan dibagikan ke pihak ketiga.
                </p>
              </div>
            </Card>
          </form>
        </div>
      </section>
    </div>
  )
}
