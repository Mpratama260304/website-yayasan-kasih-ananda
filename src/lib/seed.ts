import { User, GalleryCategory } from './types'
import { hashPassword, generateId } from './auth'
import { getDatabase } from './db'

export async function seedDatabase() {
  const db = getDatabase()
  
  try {
    // Seed users
    const users = await db.getUsers()
    
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
      
      await db.saveUsers([adminUser])
      console.log('✅ Default admin user created')
      console.log('Username: admin')
      console.log('Password: admin123')
    }

    const categories = await db.get<{ categories: GalleryCategory[] }>('gallery_categories_data')
    
    if (!categories || categories.categories.length === 0) {
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
      
      await db.set('gallery_categories_data', { categories: defaultCategories })
      console.log('✅ Default gallery categories created')
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}
