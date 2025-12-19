import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'Administrator',
      email: 'admin@yayasan-kasi.sch.id',
      role: 'SUPER_ADMIN',
    },
  })
  
  console.log('✅ Created admin user:', admin.username)

  // Create default settings
  const settings = await prisma.globalSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      siteName: 'Yayasan Kasih Ananda',
      siteDescription: 'Membangun generasi cerdas, berkarakter, dan berakhlak mulia melalui pendidikan berkualitas tinggi.',
      ppdbOpen: true,
      contactPhone: '+62 21 4603189',
      contactEmail: 'info@yayasankasiananda.sch.id',
      contactAddress: 'Jl. Pegangsaan Dua No.3, RT.3/RW.4, Pegangsaan Dua, Kec. Kelapa Gading, Jakarta Utara, DKI Jakarta 14250, Indonesia',
      socialMedia: {
        facebook: '',
        instagram: '',
        youtube: '',
        twitter: '',
        whatsapp: '+6221603189',
      },
    },
  })
  
  console.log('✅ Created default settings')

  // Create some sample categories
  const categories = [
    { name: 'Berita', slug: 'berita', description: 'Berita terbaru seputar yayasan' },
    { name: 'Pengumuman', slug: 'pengumuman', description: 'Pengumuman resmi' },
    { name: 'Kegiatan', slug: 'kegiatan', description: 'Kegiatan sekolah' },
    { name: 'Prestasi', slug: 'prestasi', description: 'Prestasi siswa dan sekolah' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  
  console.log('✅ Created sample categories')

  // Create some sample tags
  const tags = [
    { name: 'SD', slug: 'sd' },
    { name: 'SMP', slug: 'smp' },
    { name: 'SMK', slug: 'smk' },
    { name: 'PPDB', slug: 'ppdb' },
    { name: 'Lomba', slug: 'lomba' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    })
  }
  
  console.log('✅ Created sample tags')

  console.log('🎉 Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
