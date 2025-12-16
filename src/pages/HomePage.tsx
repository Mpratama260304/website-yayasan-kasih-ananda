import { GraduationCap, Users, BookOpen, Trophy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RouteType } from '@/components/Router'

interface HomePageProps {
  onNavigate: (route: RouteType) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const units = [
    {
      name: 'SD Kasih Ananda',
      description: 'Pendidikan dasar dengan kurikulum berkualitas dan lingkungan belajar yang menyenangkan',
      level: 'Sekolah Dasar',
    },
    {
      name: 'SMP Kasih Ananda',
      description: 'Pendidikan menengah pertama yang mengembangkan karakter dan prestasi akademik',
      level: 'Sekolah Menengah Pertama',
    },
    {
      name: 'SMK Kasih Ananda',
      description: 'Pendidikan kejuruan yang mempersiapkan siswa siap kerja dan berwirausaha',
      level: 'Sekolah Menengah Kejuruan',
    },
  ]

  const features = [
    {
      icon: BookOpen,
      title: 'Kurikulum Terintegrasi',
      description: 'Menggabungkan pendidikan akademik dengan pengembangan karakter',
    },
    {
      icon: Users,
      title: 'Tenaga Pendidik Profesional',
      description: 'Guru berpengalaman dan bersertifikat yang peduli pada setiap siswa',
    },
    {
      icon: Trophy,
      title: 'Prestasi Gemilang',
      description: 'Raih berbagai penghargaan tingkat kota, provinsi, dan nasional',
    },
  ]

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Yayasan Kasih Ananda
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed">
              Membangun Generasi Cerdas, Berkarakter, dan Berakhlak Mulia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => onNavigate('ppdb')}
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Daftar Sekarang
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onNavigate('profil')}
                className="text-lg px-8 py-6 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
              >
                Tentang Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Unit Pendidikan Kami
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tiga jenjang pendidikan dengan kualitas terbaik untuk masa depan putra-putri Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {units.map((unit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap size={28} weight="fill" className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground">{unit.level}</p>
                  </div>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {unit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Keunggulan Kami
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <feature.icon size={32} weight="fill" className="text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Siap Bergabung Bersama Kami?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Daftarkan putra-putri Anda sekarang dan wujudkan masa depan cerah bersama Yayasan Kasih Ananda
          </p>
          <Button 
            size="lg"
            onClick={() => onNavigate('ppdb')}
            className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Formulir Pendaftaran
          </Button>
        </div>
      </section>
    </div>
  )
}
