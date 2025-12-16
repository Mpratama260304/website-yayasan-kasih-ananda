import { GraduationCap, MapPin, Phone, Envelope } from '@phosphor-icons/react'

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={32} weight="fill" className="text-accent" />
              <h3 className="text-xl font-bold">Yayasan Kasih Ananda</h3>
            </div>
            <p className="text-background/80 leading-relaxed">
              Membangun generasi cerdas, berkarakter, dan berakhlak mulia melalui pendidikan berkualitas tinggi.
            </p>
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
                <span>Jl. Pendidikan No. 123, Jakarta Pusat, DKI Jakarta 10110</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={20} />
                <span>(021) 1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <Envelope size={20} />
                <span>info@kasihananda.sch.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 text-center text-background/60 text-sm">
          <p>&copy; 2024 Yayasan Kasih Ananda. Semua hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
