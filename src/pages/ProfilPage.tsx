import { Target, Eye, Heart, Medal } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'

export function ProfilPage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Profil Yayasan
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              Mengenal lebih dekat Yayasan Kasih Ananda dan komitmen kami dalam dunia pendidikan
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 lg:space-y-20">
            {/* About Section */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                Tentang Kami
              </h2>
              <div className="space-y-4 md:space-y-6">
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Yayasan Kasih Ananda adalah lembaga pendidikan yang didirikan dengan visi untuk menciptakan 
                  generasi muda Indonesia yang cerdas, berkarakter, dan berakhlak mulia. Sejak berdiri, kami 
                  telah konsisten memberikan pendidikan berkualitas tinggi dengan pendekatan yang holistik.
                </p>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Kami mengelola tiga unit pendidikan: SD Kasih Ananda, SMP Kasih Ananda, dan SMK Kasih Ananda. 
                  Setiap unit dirancang untuk memberikan pengalaman belajar yang optimal sesuai dengan tahap 
                  perkembangan siswa, dengan tetap menjaga nilai-nilai inti yayasan.
                </p>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Dengan didukung oleh tenaga pendidik profesional, fasilitas modern, dan kurikulum yang 
                  terintegrasi, kami berkomitmen untuk menghasilkan lulusan yang tidak hanya unggul secara 
                  akademik, tetapi juga memiliki karakter kuat dan siap menghadapi tantangan masa depan.
                </p>
              </div>
            </div>

            {/* Vision & Mission Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
              <Card className="p-6 md:p-8 lg:p-10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-primary/5">
                <div className="flex gap-4 md:gap-5 mb-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Eye size={32} weight="fill" className="text-primary md:scale-125" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">Visi</h3>
                </div>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Menjadi lembaga pendidikan terkemuka yang menghasilkan generasi cerdas, berkarakter, 
                  dan berakhlak mulia yang mampu bersaing di tingkat nasional dan global.
                </p>
              </Card>

              <Card className="p-6 md:p-8 lg:p-10 border-2 border-accent/20 hover:border-accent/40 hover:shadow-lg transition-all duration-300 bg-accent/5">
                <div className="flex gap-4 md:gap-5 mb-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Target size={32} weight="fill" className="text-accent md:scale-125" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">Misi</h3>
                </div>
                <ul className="text-base md:text-lg text-foreground/80 leading-relaxed space-y-3 list-disc list-inside">
                  <li>Memberikan pendidikan berkualitas tinggi</li>
                  <li>Mengembangkan karakter dan akhlak mulia</li>
                  <li>Memfasilitasi pengembangan potensi siswa</li>
                  <li>Menciptakan lingkungan belajar yang kondusif</li>
                </ul>
              </Card>
            </div>

            {/* Values Section */}
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                Nilai-Nilai Kami
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {[
                  { 
                    icon: Heart, 
                    title: 'Kasih Sayang', 
                    desc: 'Mendidik dengan penuh kasih dan perhatian',
                    color: 'bg-red-50 border-red-200 hover:border-red-400 text-red-600'
                  },
                  { 
                    icon: Medal, 
                    title: 'Prestasi', 
                    desc: 'Mendorong keunggulan dalam setiap aspek',
                    color: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 text-yellow-600'
                  },
                  { 
                    icon: Target, 
                    title: 'Integritas', 
                    desc: 'Menjunjung tinggi kejujuran dan tanggung jawab',
                    color: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-600'
                  },
                  { 
                    icon: Eye, 
                    title: 'Visioner', 
                    desc: 'Berpikir maju untuk masa depan cerah',
                    color: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-600'
                  },
                ].map((value, index) => (
                  <Card 
                    key={index} 
                    className={`p-6 md:p-8 text-center border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${value.color}`}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-white shadow-md flex items-center justify-center">
                      <value.icon size={32} weight="fill" className={value.color.split(' ').pop()} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">
                      {value.title}
                    </h3>
                    <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                      {value.desc}
                    </p>
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
