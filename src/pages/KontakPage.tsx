import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MapPin, Phone, EnvelopeSimple, PaperPlaneTilt, CheckCircle, WhatsappLogo, Clock } from '@phosphor-icons/react'
import { contactApi } from '@/lib/api'
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
      // Send to API
      await contactApi.send({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })
      
      console.log('✅ Contact message sent to server')
      toast.success('Pesan Anda berhasil dikirim!')
      setIsSuccess(true)

    } catch (error) {
      console.error('❌ Error saving contact message:', error)
      toast.error('Gagal mengirim pesan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
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

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Hubungi Kami
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/90 leading-relaxed">
              Kami siap membantu menjawab pertanyaan Anda tentang Yayasan Kasih Ananda
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  Informasi Kontak
                </h2>
                <p className="text-muted-foreground">
                  Silakan hubungi kami melalui informasi kontak di bawah ini atau isi formulir untuk mengirim pesan langsung.
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Alamat</h3>
                      <p className="text-muted-foreground text-sm">
                        {contactInfo.address.line1}<br />
                        {contactInfo.address.line2}<br />
                        {contactInfo.address.line3}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Telepon</h3>
                      <a href={contactInfo.phoneLink} className="text-primary hover:underline">
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <EnvelopeSimple size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline">
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Jam Operasional</h3>
                      <p className="text-muted-foreground text-sm">
                        {contactInfo.operationalHours}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-4">
                <a
                  href="https://wa.me/622146031189"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <WhatsappLogo size={20} />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="p-6 md:p-8">
                {isSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={36} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Pesan Terkirim!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Terima kasih telah menghubungi kami. Kami akan segera merespon pesan Anda.
                    </p>
                    <Button onClick={handleReset}>
                      Kirim Pesan Lagi
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">
                      Kirim Pesan
                    </h2>

                    {/* Honeypot field - hidden from users */}
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="email@example.com"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">No. HP/WhatsApp *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="08xx-xxxx-xxxx"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subjek *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Subjek pesan"
                        className={errors.subject ? 'border-red-500' : ''}
                      />
                      {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Pesan *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tulis pesan Anda di sini..."
                        rows={5}
                        className={errors.message ? 'border-red-500' : ''}
                      />
                      {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      <PaperPlaneTilt size={20} />
                      {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
