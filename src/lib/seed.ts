import { User, GalleryCategory } from './types'
import { hashPassword, generateId } from './auth'

export async function seedDatabase() {
  const users = await window.spark.kv.get<User[]>('users')
  
  if (!users || users.length === 0) {
    const hashedPassword = await hashPassword('admin123')
    const adminUser: User = {
      id: generateId(),
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Administrator',
      createdAt: new Date().toISOString()
    }
    
    await window.spark.kv.set('users', [adminUser])
    console.log('✅ Default admin user created')
    console.log('Username: admin')
    console.log('Password: admin123')
  }

  const categories = await window.spark.kv.get<GalleryCategory[]>('gallery-categories')
  
  if (!categories || categories.length === 0) {
    const defaultCategories: GalleryCategory[] = [
      { id: generateId(), name: 'Kegiatan Belajar', unit: 'SD' },
      { id: generateId(), name: 'Olahraga', unit: 'SD' },
      { id: generateId(), name: 'Seni & Budaya', unit: 'SD' },
      { id: generateId(), name: 'Kegiatan Belajar', unit: 'SMP' },
      { id: generateId(), name: 'Olahraga', unit: 'SMP' },
      { id: generateId(), name: 'Ekstrakurikuler', unit: 'SMP' },
      { id: generateId(), name: 'Praktik Kejuruan', unit: 'SMK' },
      { id: generateId(), name: 'Industri', unit: 'SMK' },
      { id: generateId(), name: 'Kompetisi', unit: 'SMK' },
      { id: generateId(), name: 'Acara Yayasan', unit: 'YAYASAN' },
      { id: generateId(), name: 'Upacara', unit: 'YAYASAN' },
    ]
    
    await window.spark.kv.set('gallery-categories', defaultCategories)
    console.log('✅ Default gallery categories created')
  }
}
