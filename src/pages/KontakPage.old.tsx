import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MapPin, Phone, EnvelopeSimple, PaperPlaneTilt, CheckCircle, WhatsappLogo, Clock } from '@phosphor-icons/react'
import { getDatabase } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { ContactMessage } from '@/lib/types'
import { toast } from 'sonner'

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
}

export function KontakPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [honeypot, setHoneypot] = useState('') // Anti-spam honeypot field

  // Contact information
  const contactInfo = {
    address: {
      line1: 'Jl. Pegangsaan Dua No.3, RT.3/RW.4',
      line2: 'Pegangsaan Dua, Kec. Kelapa Gading',
      line3: 'Jakarta Utara, DKI Jakarta 14250, Indonesia'
    },
    phone: '+62 21 4603189',
    phoneLink: 'tel:+622146031189',
    email: 'info@yayasankasiananda.sch.id',
    operationalHours: 'Senin - Jumat: 07:00 - 16:00 WIB'
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    // Phone validation
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor HP/WhatsApp wajib diisi'
    } else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Format nomor HP tidak valid'
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subjek wajib diisi'
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subjek minimal 5 karakter'
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Pesan wajib diisi'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Pesan minimal 20 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log('🤖 Bot detected via honeypot')
      setIsSuccess(true) // Fake success for bots
      return
    }

    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field dengan benar')
      return
    }

    setIsSubmitting(true)

    try {
      const db = getDatabase()
      
      const newMessage: ContactMessage = {
        id: generateId(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'NEW',
        createdAt: new Date().toISOString()
      }

      await db.saveContactMessage(newMessage)
      
      console.log('✅ Contact message saved:', newMessage.id)
      toast.success('Pesan Anda berhasil dikirim!')
      setIsSuccess(true)

    } catch (error) {
      console.error('❌ Error saving contact message:', error)
      toast.error('Gagal mengirim pesan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendAnother = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
    setErrors({})
    setIsSuccess(false)
  }

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Hubungi Kami</h1>
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90">
                Pesan Anda telah terkirim
              </p>
            </div>
          </div>
        </section>

        {/* Success Message */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <Card className="max-w-2xl mx-auto p-8 md:p-12 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={48} weight="fill" className="text-green-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Terima Kasih! 🙏
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                Pesan Anda telah berhasil dikirim. Tim kami akan segera menghubungi Anda 
                melalui email atau nomor telepon yang telah diberikan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleSendAnother} size="lg" className="gap-2">
                  <PaperPlaneTilt size={20} />
                  Kirim Pesan Lagi
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
                  Kembali ke Beranda
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Hubungi Kami
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              Ada pertanyaan? Silakan hubungi kami melalui informasi di bawah ini atau kirim pesan langsung
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              
              {/* Contact Information */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Informasi Kontak
                  </h2>
                  <p className="text-muted-foreground">
                    Kunjungi kantor kami atau hubungi langsung
                  </p>
                </div>

                {/* Address */}
                <Card className="p-6 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} weight="fill" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Alamat</h3>
                      <address className="not-italic text-muted-foreground text-sm md:text-base leading-relaxed">
                        {contactInfo.address.line1}<br />
                        {contactInfo.address.line2}<br />
                        {contactInfo.address.line3}
                      </address>
                    </div>
                  </div>
                </Card>

                {/* Phone */}
                <Card className="p-6 border-l-4 border-l-accent hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={24} weight="fill" className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Telepon</h3>
                      <a 
                        href={contactInfo.phoneLink}
                        className="text-accent hover:underline font-medium text-lg"
                      >
                        {contactInfo.phone}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <WhatsappLogo size={16} className="text-green-600" />
                        WhatsApp juga tersedia
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Operational Hours */}
                <Card className="p-6 border-l-4 border-l-secondary hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={24} weight="fill" className="text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Jam Operasional</h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        {contactInfo.operationalHours}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sabtu & Minggu: Tutup
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Google Maps Embed */}
                <Card className="overflow-hidden">
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4!2d106.9!3d-6.15!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDknMDAuMCJTIDEwNsKwNTQnMDAuMCJF!5e0!3m2!1sen!2sid!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Lokasi Yayasan Kasih Ananda"
                      className="grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="p-3 bg-muted/50 text-center">
                    <a 
                      href="https://maps.google.com/?q=Jl.+Pegangsaan+Dua+No.3+Jakarta+Utara"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      📍 Buka di Google Maps
                    </a>
                  </div>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                <Card className="p-6 md:p-8 lg:p-10 shadow-lg">
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      Kirim Pesan
                    </h2>
                    <p className="text-muted-foreground">
                      Isi formulir di bawah ini dan kami akan segera menghubungi Anda
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot field - hidden from users, visible to bots */}
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-semibold">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Masukkan nama lengkap"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`h-11 md:h-12 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-semibold">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contoh@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`h-11 md:h-12 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-semibold">
                          Nomor HP / WhatsApp <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`h-11 md:h-12 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500">{errors.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-base font-semibold">
                          Subjek <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="subject"
                          placeholder="Perihal pesan Anda"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          className={`h-11 md:h-12 ${errors.subject ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.subject && (
                          <p className="text-sm text-red-500">{errors.subject}</p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base font-semibold">
                        Pesan <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tulis pesan Anda di sini..."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={6}
                        className={`resize-none ${errors.message ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {errors.message ? (
                          <p className="text-red-500">{errors.message}</p>
                        ) : (
                          <p>Minimal 20 karakter</p>
                        )}
                        <p>{formData.message.length} karakter</p>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      <p>
                        🔒 Data Anda aman dan hanya akan digunakan untuk merespons pertanyaan Anda. 
                        Kami tidak akan membagikan informasi Anda kepada pihak ketiga.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full h-12 md:h-14 text-base md:text-lg font-semibold gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <PaperPlaneTilt size={20} weight="fill" />
                          Kirim Pesan
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
