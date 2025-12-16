import { Target, Eye, Heart, Medal } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'

export function ProfilPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Profil Yayasan</h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Mengenal lebih dekat Yayasan Kasih Ananda dan komitmen kami dalam dunia pendidikan
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Tentang Kami</h2>
              <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4">
                <p>
                  Yayasan Kasih Ananda adalah lembaga pendidikan yang didirikan dengan visi untuk menciptakan 
                  generasi muda Indonesia yang cerdas, berkarakter, dan berakhlak mulia. Sejak berdiri, kami 
                  telah konsisten memberikan pendidikan berkualitas tinggi dengan pendekatan yang holistik.
                </p>
                <p>
                  Kami mengelola tiga unit pendidikan: SD Kasih Ananda, SMP Kasih Ananda, dan SMK Kasih Ananda. 
                  Setiap unit dirancang untuk memberikan pengalaman belajar yang optimal sesuai dengan tahap 
                  perkembangan siswa, dengan tetap menjaga nilai-nilai inti yayasan.
                </p>
                <p>
                  Dengan didukung oleh tenaga pendidik profesional, fasilitas modern, dan kurikulum yang 
                  terintegrasi, kami berkomitmen untuk menghasilkan lulusan yang tidak hanya unggul secara 
                  akademik, tetapi juga memiliki karakter kuat dan siap menghadapi tantangan masa depan.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Eye size={28} weight="fill" className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Visi</h3>
                    <p className="text-foreground/80 leading-relaxed">
                      Menjadi lembaga pendidikan terkemuka yang menghasilkan generasi cerdas, berkarakter, 
                      dan berakhlak mulia yang mampu bersaing di tingkat nasional dan global.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Target size={28} weight="fill" className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Misi</h3>
                    <ul className="text-foreground/80 leading-relaxed space-y-2 list-disc list-inside">
                      <li>Memberikan pendidikan berkualitas tinggi</li>
                      <li>Mengembangkan karakter dan akhlak mulia</li>
                      <li>Memfasilitasi pengembangan potensi siswa</li>
                      <li>Menciptakan lingkungan belajar yang kondusif</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Nilai-Nilai Kami</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Heart, title: 'Kasih Sayang', desc: 'Mendidik dengan penuh kasih dan perhatian' },
                  { icon: Medal, title: 'Prestasi', desc: 'Mendorong keunggulan dalam setiap aspek' },
                  { icon: Target, title: 'Integritas', desc: 'Menjunjung tinggi kejujuran dan tanggung jawab' },
                  { icon: Eye, title: 'Visioner', desc: 'Berpikir maju untuk masa depan cerah' },
                ].map((value, index) => (
                  <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <value.icon size={28} weight="fill" className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
