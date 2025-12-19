/**
 * ═══════════════════════════════════════════════════════════════════
 * API CLIENT - Server-side data access
 * ═══════════════════════════════════════════════════════════════════
 * 
 * This replaces the localStorage-based database with API calls
 * ALL data now comes from the PostgreSQL backend
 * 
 * ❌ NO localStorage
 * ❌ NO IndexedDB
 * ❌ NO client-side persistence
 * ✅ All data via REST API
 * ═══════════════════════════════════════════════════════════════════
 */

const API_BASE = '/api'

// ===========================================
// HTTP HELPERS
// ===========================================
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const config: RequestInit = {
    credentials: 'include', // Include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }
  
  // Add auth token if available
  const token = getAuthToken()
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
  }
  
  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }
  
  return response.json()
}

async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' })
}

async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

async function put<T>(endpoint: string, data: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

async function patch<T>(endpoint: string, data: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' })
}

// ===========================================
// AUTH TOKEN MANAGEMENT (Session storage only for token)
// ===========================================
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    sessionStorage.setItem('auth_token', token)
  } else {
    sessionStorage.removeItem('auth_token')
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = sessionStorage.getItem('auth_token')
  }
  return authToken
}

export function clearAuthToken() {
  authToken = null
  sessionStorage.removeItem('auth_token')
}

// ===========================================
// TYPE DEFINITIONS
// ===========================================
export type UnitType = 'SD' | 'SMP' | 'SMK' | 'YAYASAN'

export interface User {
  id: string
  username: string
  role: string
  name: string
  email?: string
  avatar?: string
  createdAt: string
  updatedAt?: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  status: 'DRAFT' | 'PUBLISHED'
  authorId: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
  categories: Category[]
  tags: Tag[]
  publishedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface GalleryPhoto {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  unit: UnitType
  albumId?: string
  album?: GalleryAlbum
  likes: number
  views: number
  createdAt: string
  updatedAt?: string
}

export interface GalleryAlbum {
  id: string
  name: string
  description?: string
  unit: UnitType
  coverImage?: string
  eventDate?: string
  photos?: GalleryPhoto[]
  _count?: { photos: number }
  createdAt: string
  updatedAt?: string
}

export interface GalleryCategory {
  id: string
  name: string
  unit: UnitType
  createdAt: string
}

export interface Enrollment {
  id: string
  registrationNo: string
  fullName: string
  nik?: string
  birthPlace: string
  birthDate: string
  gender: 'LAKI_LAKI' | 'PEREMPUAN'
  religion?: string
  citizenship?: string
  unit: 'SD' | 'SMP' | 'SMK'
  academicYear: string
  registrationPath: 'REGULER' | 'PRESTASI' | 'MUTASI' | 'BEASISWA'
  fatherData?: Record<string, unknown>
  motherData?: Record<string, unknown>
  guardianData?: Record<string, unknown>
  previousSchool?: Record<string, unknown>
  address?: string
  province?: string
  city?: string
  district?: string
  village?: string
  postalCode?: string
  photoPath?: string
  birthCertPath?: string
  familyCardPath?: string
  diplomaPath?: string
  status: 'PENDING' | 'REVIEW' | 'ACCEPTED' | 'REJECTED' | 'ENROLLED'
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  repliedAt?: string
  createdAt: string
}

export interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  width?: number
  height?: number
  alt?: string
  caption?: string
  uploadedBy?: string
  createdAt: string
}

export interface GlobalSettings {
  id: string
  siteName: string
  siteDescription?: string
  logo?: string
  favicon?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
    whatsapp?: string
  }
  ppdbOpen: boolean
  ppdbOpenMessage?: string
  ppdbClosedMessage?: string
  updatedAt: string
}

export interface DashboardStats {
  posts: { total: number; published: number }
  enrollments: { total: number; pending: number }
  messages: { total: number; unread: number }
  gallery: { total: number }
}

// ===========================================
// AUTH API
// ===========================================
export const authApi = {
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const result = await post<{ success: boolean; user: User; token: string }>('/auth/login', { username, password })
    setAuthToken(result.token)
    return result
  },
  
  async logout(): Promise<void> {
    await post('/auth/logout')
    clearAuthToken()
  },
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const result = await get<{ user: User }>('/auth/me')
      return result.user
    } catch {
      clearAuthToken()
      return null
    }
  },
}

// ===========================================
// USERS API
// ===========================================
export const usersApi = {
  async getAll(): Promise<User[]> {
    return get<User[]>('/users')
  },
  
  async getById(id: string): Promise<User> {
    return get<User>(`/users/${id}`)
  },
  
  async update(id: string, data: Partial<User>): Promise<User> {
    return put<User>(`/users/${id}`, data)
  },
  
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    return patch<User>(`/users/${id}/password`, { currentPassword, newPassword })
  },
  
  async checkUsernameExists(username: string): Promise<boolean> {
    const result = await get<{ exists: boolean }>(`/users/check-username/${username}`)
    return result.exists
  },
}

// ===========================================
// POSTS API
// ===========================================
export const postsApi = {
  async getAll(options?: { status?: string; category?: string; search?: string; limit?: number; offset?: number }): Promise<Post[]> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.category) params.append('category', options.category)
    if (options?.search) params.append('search', options.search)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    
    const query = params.toString()
    return get<Post[]>(`/posts${query ? `?${query}` : ''}`)
  },
  
  async getById(id: string): Promise<Post> {
    return get<Post>(`/posts/${id}`)
  },
  
  async getBySlug(slug: string): Promise<Post> {
    return get<Post>(`/posts/slug/${slug}`)
  },
  
  async create(data: Partial<Post> & { categories?: string[]; tags?: string[] }): Promise<Post> {
    return post<Post>('/posts', data)
  },
  
  async update(id: string, data: Partial<Post> & { categories?: string[]; tags?: string[] }): Promise<Post> {
    return put<Post>(`/posts/${id}`, data)
  },
  
  async delete(id: string): Promise<void> {
    await del(`/posts/${id}`)
  },
}

// ===========================================
// CATEGORIES API
// ===========================================
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return get<Category[]>('/categories')
  },
  
  async create(data: { name: string; description?: string }): Promise<Category> {
    return post<Category>('/categories', data)
  },
  
  async update(id: string, data: Partial<Category>): Promise<Category> {
    return put<Category>(`/categories/${id}`, data)
  },
  
  async delete(id: string): Promise<void> {
    await del(`/categories/${id}`)
  },
}

// ===========================================
// TAGS API
// ===========================================
export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    return get<Tag[]>('/tags')
  },
  
  async create(name: string): Promise<Tag> {
    return post<Tag>('/tags', { name })
  },
  
  async delete(id: string): Promise<void> {
    await del(`/tags/${id}`)
  },
}

// ===========================================
// GALLERY API
// ===========================================
export const galleryApi = {
  async getPhotos(options?: { unit?: string; album?: string; limit?: number; offset?: number }): Promise<GalleryPhoto[]> {
    const params = new URLSearchParams()
    if (options?.unit) params.append('unit', options.unit)
    if (options?.album) params.append('album', options.album)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    
    const query = params.toString()
    return get<GalleryPhoto[]>(`/gallery${query ? `?${query}` : ''}`)
  },
  
  async createPhoto(data: Partial<GalleryPhoto>): Promise<GalleryPhoto> {
    return post<GalleryPhoto>('/gallery', data)
  },
  
  async updatePhoto(id: string, data: Partial<GalleryPhoto>): Promise<GalleryPhoto> {
    return put<GalleryPhoto>(`/gallery/${id}`, data)
  },
  
  async deletePhoto(id: string): Promise<void> {
    await del(`/gallery/${id}`)
  },
  
  // Albums
  async getAlbums(unit?: string): Promise<GalleryAlbum[]> {
    const query = unit ? `?unit=${unit}` : ''
    return get<GalleryAlbum[]>(`/gallery/albums${query}`)
  },
  
  async createAlbum(data: Partial<GalleryAlbum>): Promise<GalleryAlbum> {
    return post<GalleryAlbum>('/gallery/albums', data)
  },
  
  async updateAlbum(id: string, data: Partial<GalleryAlbum>): Promise<GalleryAlbum> {
    return put<GalleryAlbum>(`/gallery/albums/${id}`, data)
  },
  
  async deleteAlbum(id: string): Promise<void> {
    await del(`/gallery/albums/${id}`)
  },
  
  // Categories
  async getCategories(unit?: string): Promise<GalleryCategory[]> {
    const query = unit ? `?unit=${unit}` : ''
    return get<GalleryCategory[]>(`/gallery/categories${query}`)
  },
  
  async createCategory(data: { name: string; unit: string }): Promise<GalleryCategory> {
    return post<GalleryCategory>('/gallery/categories', data)
  },
  
  async deleteCategory(id: string): Promise<void> {
    await del(`/gallery/categories/${id}`)
  },
}

// ===========================================
// ENROLLMENTS API
// ===========================================
export const enrollmentsApi = {
  async getAll(options?: { unit?: string; status?: string; academicYear?: string; limit?: number; offset?: number }): Promise<Enrollment[]> {
    const params = new URLSearchParams()
    if (options?.unit) params.append('unit', options.unit)
    if (options?.status) params.append('status', options.status)
    if (options?.academicYear) params.append('academicYear', options.academicYear)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    
    const query = params.toString()
    return get<Enrollment[]>(`/enrollments${query ? `?${query}` : ''}`)
  },
  
  async getById(id: string): Promise<Enrollment> {
    return get<Enrollment>(`/enrollments/${id}`)
  },
  
  async create(data: Partial<Enrollment>): Promise<Enrollment> {
    return post<Enrollment>('/enrollments', data)
  },
  
  async update(id: string, data: Partial<Enrollment>): Promise<Enrollment> {
    return put<Enrollment>(`/enrollments/${id}`, data)
  },
  
  async delete(id: string): Promise<void> {
    await del(`/enrollments/${id}`)
  },
  
  async updateStatus(id: string, status: string): Promise<Enrollment> {
    return patch<Enrollment>(`/enrollments/${id}/status`, { status })
  },
  
  async checkNikExists(nik: string): Promise<boolean> {
    const result = await get<{ exists: boolean }>(`/enrollments/check-nik/${nik}`)
    return result.exists
  },
  
  async getStats(): Promise<{ total: number; byStatus: Record<string, number>; byUnit: Record<string, number> }> {
    return get('/enrollments/stats')
  },
}

// ===========================================
// CONTACT API
// ===========================================
export const contactApi = {
  async getAll(options?: { status?: string; limit?: number; offset?: number }): Promise<ContactMessage[]> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    
    const query = params.toString()
    return get<ContactMessage[]>(`/contact${query ? `?${query}` : ''}`)
  },
  
  async getById(id: string): Promise<ContactMessage> {
    return get<ContactMessage>(`/contact/${id}`)
  },
  
  async send(data: { name: string; email: string; phone?: string; subject?: string; message: string }): Promise<ContactMessage> {
    return post<ContactMessage>('/contact', data)
  },
  
  async updateStatus(id: string, status: string): Promise<ContactMessage> {
    return patch<ContactMessage>(`/contact/${id}/status`, { status })
  },
  
  async delete(id: string): Promise<void> {
    await del(`/contact/${id}`)
  },
  
  async getUnreadCount(): Promise<number> {
    const result = await get<{ count: number }>('/contact/unread-count')
    return result.count
  },
}

// ===========================================
// MEDIA API
// ===========================================
export const mediaApi = {
  async getAll(options?: { type?: string; limit?: number; offset?: number }): Promise<MediaFile[]> {
    const params = new URLSearchParams()
    if (options?.type) params.append('type', options.type)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    
    const query = params.toString()
    return get<MediaFile[]>(`/media${query ? `?${query}` : ''}`)
  },
  
  async delete(id: string): Promise<void> {
    await del(`/media/${id}`)
  },
}

// ===========================================
// SETTINGS API
// ===========================================
export const settingsApi = {
  async get(): Promise<GlobalSettings> {
    return get<GlobalSettings>('/settings')
  },
  
  async update(data: Partial<GlobalSettings>): Promise<GlobalSettings> {
    return put<GlobalSettings>('/settings', data)
  },
  
  async getPPDBStatus(): Promise<{ isOpen: boolean; openMessage?: string; closedMessage?: string }> {
    return get('/settings/ppdb')
  },
  
  async setPPDBStatus(isOpen: boolean): Promise<{ isOpen: boolean; openMessage?: string; closedMessage?: string }> {
    return patch('/settings/ppdb', { isOpen })
  },
}

// ===========================================
// DASHBOARD API
// ===========================================
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    return get<DashboardStats>('/dashboard/stats')
  },
}

// ===========================================
// UPLOAD API
// ===========================================
export const uploadApi = {
  async uploadFile(file: File): Promise<{ url: string; filename: string; originalName: string; mimeType: string; size: number }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  },
  
  async uploadMultiple(files: File[]): Promise<{ successful: Array<{ url: string; filename: string }>; failed: Array<{ originalName: string; error: string }> }> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  },
  
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/upload/avatar`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  },
  
  async deleteFile(subdir: string, filename: string): Promise<void> {
    await del(`/upload/${subdir}/${filename}`)
  },
  
  async listFiles(): Promise<{ files: Array<{ filename: string; url: string; subdir: string; size: number; createdAt: string }> }> {
    return get('/files')
  },
}

// ===========================================
// HEALTH CHECK
// ===========================================
export async function checkApiHealth(): Promise<boolean> {
  try {
    const result = await get<{ status: string; database: string }>('/health')
    return result.status === 'ok' && result.database === 'connected'
  } catch {
    return false
  }
}
