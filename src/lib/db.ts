import { Post, User, Enrollment, GalleryPhoto, GalleryCategory, GalleryAlbum, ContactMessage, ContactMessageStatus, Category, Tag, MediaFile, CMSSettings } from './types'

/**
 * Simple file-based database using IndexedDB with localStorage fallback
 * This provides persistent storage that survives page refresh
 */

const DB_NAME = 'yayasan_kasi_db'
const DB_VERSION = 1

interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  getAll<T>(prefix: string): Promise<T[]>
}

// IndexedDB Adapter (primary - survives refresh)
class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null
  private ready = false

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.ready = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data')
        }
      }
    })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.ready) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('data', 'readonly')
      const store = tx.objectStore('data')
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.ready) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('data', 'readwrite')
      const store = tx.objectStore('data')
      const request = store.put(value, key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(key: string): Promise<void> {
    if (!this.ready) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('data', 'readwrite')
      const store = tx.objectStore('data')
      const request = store.delete(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAll<T>(prefix: string): Promise<T[]> {
    if (!this.ready) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('data', 'readonly')
      const store = tx.objectStore('data')
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results: T[] = []
        for (const item of request.result) {
          if (typeof item === 'object' && item !== null) {
            const keys = Object.keys(item as object)
            if (keys[0]?.startsWith(prefix)) {
              results.push(item as T)
            }
          }
        }
        resolve(results)
      }
    })
  }
}

// LocalStorage Adapter (fallback for debugging)
class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('LocalStorage quota exceeded:', e)
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async getAll<T>(prefix: string): Promise<T[]> {
    const results: T[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        const item = localStorage.getItem(key)
        if (item) {
          try {
            results.push(JSON.parse(item))
          } catch {
            // Skip invalid items
          }
        }
      }
    }
    return results
  }
}

class Database {
  private adapter: StorageAdapter
  private initialized = false

  constructor() {
    try {
      this.adapter = new IndexedDBAdapter()
    } catch {
      this.adapter = new LocalStorageAdapter()
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return
    try {
      if (this.adapter instanceof IndexedDBAdapter) {
        await this.adapter.init()
      }
      this.initialized = true
      console.log('✅ Database initialized with persistent storage')
    } catch (error) {
      console.warn('⚠️ Database initialization fallback to localStorage:', error)
      this.initialized = true
    }
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    await this.init()
    const data = await this.adapter.get<{ posts: Post[] }>('posts_data')
    return data?.posts || []
  }

  async savePost(post: Post): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ posts: Post[] }>('posts_data') || { posts: [] }
    const index = data.posts.findIndex(p => p.id === post.id)
    if (index >= 0) {
      data.posts[index] = post
    } else {
      data.posts.push(post)
    }
    await this.adapter.set('posts_data', data)
  }

  async deletePost(postId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ posts: Post[] }>('posts_data')
    if (data) {
      data.posts = data.posts.filter(p => p.id !== postId)
      await this.adapter.set('posts_data', data)
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    await this.init()
    const data = await this.adapter.get<{ users: User[] }>('users_data')
    return data?.users || []
  }

  async saveUsers(users: User[]): Promise<void> {
    await this.init()
    await this.adapter.set('users_data', { users })
  }

  // Gallery Photos
  async getGalleryPhotos(): Promise<GalleryPhoto[]> {
    await this.init()
    const data = await this.adapter.get<{ photos: GalleryPhoto[] }>('gallery_photos_data')
    return data?.photos || []
  }

  async saveGalleryPhoto(photo: GalleryPhoto): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ photos: GalleryPhoto[] }>('gallery_photos_data') || { photos: [] }
    const index = data.photos.findIndex(p => p.id === photo.id)
    if (index >= 0) {
      data.photos[index] = photo
    } else {
      data.photos.push(photo)
    }
    await this.adapter.set('gallery_photos_data', data)
  }

  async deleteGalleryPhoto(photoId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ photos: GalleryPhoto[] }>('gallery_photos_data')
    if (data) {
      data.photos = data.photos.filter(p => p.id !== photoId)
      await this.adapter.set('gallery_photos_data', data)
    }
  }

  // Gallery Albums
  async getGalleryAlbums(): Promise<GalleryAlbum[]> {
    await this.init()
    const data = await this.adapter.get<{ albums: GalleryAlbum[] }>('gallery_albums_data')
    return data?.albums || []
  }

  async saveGalleryAlbum(album: GalleryAlbum): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ albums: GalleryAlbum[] }>('gallery_albums_data') || { albums: [] }
    const index = data.albums.findIndex(a => a.id === album.id)
    if (index >= 0) {
      data.albums[index] = album
    } else {
      data.albums.push(album)
    }
    await this.adapter.set('gallery_albums_data', data)
  }

  async deleteGalleryAlbum(albumId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ albums: GalleryAlbum[] }>('gallery_albums_data')
    if (data) {
      data.albums = data.albums.filter(a => a.id !== albumId)
      await this.adapter.set('gallery_albums_data', data)
    }
  }

  // Gallery Categories
  async getGalleryCategories(): Promise<GalleryCategory[]> {
    await this.init()
    const data = await this.adapter.get<{ categories: GalleryCategory[] }>('gallery_categories_data')
    return data?.categories || []
  }

  async saveGalleryCategories(categories: GalleryCategory[]): Promise<void> {
    await this.init()
    await this.adapter.set('gallery_categories_data', { categories })
  }

  // Enrollments (PPDB)
  async getEnrollments(): Promise<Enrollment[]> {
    await this.init()
    const data = await this.adapter.get<{ enrollments: Enrollment[] }>('enrollments_data')
    return data?.enrollments || []
  }

  async saveEnrollment(enrollment: Enrollment): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ enrollments: Enrollment[] }>('enrollments_data') || { enrollments: [] }
    const index = data.enrollments.findIndex(e => e.id === enrollment.id)
    if (index >= 0) {
      data.enrollments[index] = enrollment
    } else {
      data.enrollments.push(enrollment)
    }
    await this.adapter.set('enrollments_data', data)
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ enrollments: Enrollment[] }>('enrollments_data')
    if (data) {
      data.enrollments = data.enrollments.filter(e => e.id !== enrollmentId)
      await this.adapter.set('enrollments_data', data)
    }
  }

  async updateEnrollmentStatus(enrollmentId: string, status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED'): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ enrollments: Enrollment[] }>('enrollments_data')
    if (data) {
      const enrollment = data.enrollments.find(e => e.id === enrollmentId)
      if (enrollment) {
        enrollment.status = status
        enrollment.updatedAt = new Date().toISOString()
        await this.adapter.set('enrollments_data', data)
      }
    }
  }

  // Contact Messages (Hubungi Kami)
  async getContactMessages(): Promise<ContactMessage[]> {
    await this.init()
    const data = await this.adapter.get<{ messages: ContactMessage[] }>('contact_messages_data')
    return data?.messages || []
  }

  async saveContactMessage(message: ContactMessage): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ messages: ContactMessage[] }>('contact_messages_data') || { messages: [] }
    const index = data.messages.findIndex(m => m.id === message.id)
    if (index >= 0) {
      data.messages[index] = message
    } else {
      data.messages.push(message)
    }
    await this.adapter.set('contact_messages_data', data)
  }

  async deleteContactMessage(messageId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ messages: ContactMessage[] }>('contact_messages_data')
    if (data) {
      data.messages = data.messages.filter(m => m.id !== messageId)
      await this.adapter.set('contact_messages_data', data)
    }
  }

  async updateContactMessageStatus(messageId: string, status: ContactMessageStatus): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ messages: ContactMessage[] }>('contact_messages_data')
    if (data) {
      const message = data.messages.find(m => m.id === messageId)
      if (message) {
        message.status = status
        message.updatedAt = new Date().toISOString()
        if (status === 'REPLIED') {
          message.repliedAt = new Date().toISOString()
        }
        await this.adapter.set('contact_messages_data', data)
      }
    }
  }

  // Generic storage
  async get<T>(key: string): Promise<T | null> {
    await this.init()
    return this.adapter.get<T>(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.init()
    await this.adapter.set(key, value)
  }

  async delete(key: string): Promise<void> {
    await this.init()
    await this.adapter.delete(key)
  }

  // ============================================
  // CMS SETTINGS
  // ============================================

  async getSettings(): Promise<CMSSettings> {
    await this.init()
    const data = await this.adapter.get<CMSSettings>('cms_settings')
    return data || {
      siteName: 'Yayasan Kasih Ananda',
      siteDescription: 'Yayasan pendidikan yang berdedikasi untuk mencerdaskan anak bangsa',
      ppdbStatus: 'OPEN',
      ppdbOpenMessage: 'Pendaftaran Peserta Didik Baru sedang dibuka!',
      ppdbClosedMessage: 'Pendaftaran Peserta Didik Baru saat ini ditutup.',
      contactPhone: '+62 812 3456 7890',
      contactEmail: 'info@kasiananda.sch.id',
      contactAddress: 'Jl. Pendidikan No. 1, Jakarta',
    }
  }

  async saveSettings(settings: CMSSettings): Promise<void> {
    await this.init()
    settings.updatedAt = new Date().toISOString()
    await this.adapter.set('cms_settings', settings)
  }

  // ============================================
  // CATEGORIES
  // ============================================

  async getCategories(): Promise<Category[]> {
    await this.init()
    const data = await this.adapter.get<{ categories: Category[] }>('categories_data')
    return data?.categories || []
  }

  async saveCategory(category: Category): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ categories: Category[] }>('categories_data') || { categories: [] }
    const index = data.categories.findIndex(c => c.id === category.id)
    if (index >= 0) {
      data.categories[index] = category
    } else {
      data.categories.push(category)
    }
    await this.adapter.set('categories_data', data)
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ categories: Category[] }>('categories_data')
    if (data) {
      data.categories = data.categories.filter(c => c.id !== categoryId)
      await this.adapter.set('categories_data', data)
    }
  }

  // ============================================
  // TAGS
  // ============================================

  async getTags(): Promise<Tag[]> {
    await this.init()
    const data = await this.adapter.get<{ tags: Tag[] }>('tags_data')
    return data?.tags || []
  }

  async saveTag(tag: Tag): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ tags: Tag[] }>('tags_data') || { tags: [] }
    const index = data.tags.findIndex(t => t.id === tag.id)
    if (index >= 0) {
      data.tags[index] = tag
    } else {
      data.tags.push(tag)
    }
    await this.adapter.set('tags_data', data)
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ tags: Tag[] }>('tags_data')
    if (data) {
      data.tags = data.tags.filter(t => t.id !== tagId)
      await this.adapter.set('tags_data', data)
    }
  }

  // ============================================
  // MEDIA LIBRARY
  // ============================================

  async getMedia(): Promise<MediaFile[]> {
    await this.init()
    const data = await this.adapter.get<{ media: MediaFile[] }>('media_data')
    return data?.media || []
  }

  async saveMedia(file: MediaFile): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ media: MediaFile[] }>('media_data') || { media: [] }
    const index = data.media.findIndex(m => m.id === file.id)
    if (index >= 0) {
      data.media[index] = file
    } else {
      data.media.push(file)
    }
    await this.adapter.set('media_data', data)
  }

  async deleteMedia(mediaId: string): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ media: MediaFile[] }>('media_data')
    if (data) {
      data.media = data.media.filter(m => m.id !== mediaId)
      await this.adapter.set('media_data', data)
    }
  }

  // ============================================
  // POSTS (ENHANCED)
  // ============================================

  async getPostBySlug(slug: string): Promise<Post | null> {
    await this.init()
    const posts = await this.getPosts()
    return posts.find(p => p.slug === slug) || null
  }

  async getPublishedPosts(): Promise<Post[]> {
    await this.init()
    const posts = await this.getPosts()
    return posts.filter(p => p.published)
  }

  // ============================================
  // USER PROFILE
  // ============================================

  async getUserById(userId: string): Promise<User | null> {
    await this.init()
    const users = await this.getUsers()
    return users.find(u => u.id === userId) || null
  }

  async updateUser(user: User): Promise<void> {
    await this.init()
    const data = await this.adapter.get<{ users: User[] }>('users_data') || { users: [] }
    const index = data.users.findIndex(u => u.id === user.id)
    if (index >= 0) {
      data.users[index] = { ...user, updatedAt: new Date().toISOString() }
      await this.adapter.set('users_data', data)
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database()
  }
  return dbInstance
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase()
  await db.init()
}
