import { useState, useEffect } from 'react'
import { GraduationCap, MapPin, Phone, Envelope, WhatsappLogo, FacebookLogo, InstagramLogo, YoutubeLogo, TwitterLogo } from '@phosphor-icons/react'
import { settingsApi, GlobalSettings } from '@/lib/api'

export function Footer() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.get()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Default values jika settings belum dimuat
  const siteName = settings?.siteName || 'Yayasan Kasih Ananda'
  const siteDescription = settings?.siteDescription || 'Membangun generasi cerdas, berkarakter, dan berakhlak mulia melalui pendidikan berkualitas tinggi.'
  const contactAddress = settings?.contactAddress || 'Jl. Pegangsaan Dua No.3, RT.3/RW.4, Pegangsaan Dua, Kec. Kelapa Gading, Jakarta Utara, DKI Jakarta 14250, Indonesia'
  const contactPhone = settings?.contactPhone || '+62 21 4603189'
  const contactEmail = settings?.contactEmail || 'info@yayasankasiananda.sch.id'
  const socialMedia = settings?.socialMedia
  const siteLogo = settings?.logo

  return (
    <footer className="bg-foreground text-background py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="w-8 h-8 object-contain" />
              ) : (
                <GraduationCap size={32} weight="fill" className="text-accent" />
              )}
              <h3 className="text-xl font-bold">{siteName}</h3>
            </div>
            <p className="text-background/80 leading-relaxed">
              {siteDescription}
            </p>
            
            {/* Social Media Links */}
            {socialMedia && (
              <div className="flex items-center gap-3 mt-4">
                {socialMedia.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors">
                    <FacebookLogo size={24} weight="fill" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors">
                    <InstagramLogo size={24} weight="fill" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors">
                    <YoutubeLogo size={24} weight="fill" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors">
                    <TwitterLogo size={24} weight="fill" />
                  </a>
                )}
                {socialMedia.whatsapp && (
                  <a href={`https://wa.me/${socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors">
                    <WhatsappLogo size={24} weight="fill" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Unit Pendidikan</h3>
            <ul className="space-y-2 text-background/80">
              <li>SD Kasih Ananda</li>
              <li>SMP Kasih Ananda</li>
              <li>SMK Kasih Ananda</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-background/80">
              <li className="flex items-start gap-2">
                <MapPin size={20} className="flex-shrink-0 mt-0.5" />
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={20} />
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="hover:text-accent transition-colors">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Envelope size={20} />
                <a href={`mailto:${contactEmail}`} className="hover:text-accent transition-colors">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 text-center text-background/60 text-sm">
          <p>&copy; {new Date().getFullYear()} {siteName}. Semua hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
