export interface User {
  id: string
  username: string
  password: string
  role: string
  name: string
  email?: string
  avatar?: string
  createdAt: string
  updatedAt?: string
}

// ============================================
// POST / BERITA TYPES (WordPress-like)
// ============================================

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  categories: string[]
  tags: string[]
  published: boolean
  authorId: string
  createdAt: string
  updatedAt?: string
  publishedAt?: string
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

// ============================================
// MEDIA LIBRARY TYPES
// ============================================

export interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string // base64 data URL or file path
  width?: number
  height?: number
  alt?: string
  caption?: string
  uploadedBy: string
  uploadedAt: string
}

// ============================================
// CMS SETTINGS TYPES
// ============================================

export interface CMSSettings {
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
  updatedAt?: string
}

// ============================================
// ENROLLMENT / PPDB TYPES (Indonesian School Standard)
// ============================================

export interface ParentData {
  type: 'AYAH' | 'IBU'
  fullName: string
  nik: string
  occupation: string
  education: string
  address: string
  province: string
  city: string
  district: string
  village: string
  email: string
  phone: string
  whatsappActive: boolean
  monthlyIncome: string
}

export interface GuardianData {
  name: string
  relationship: string
  phone: string
}

export interface StudentPersonalData {
  fullName: string
  nik: string
  birthPlace: string
  birthDate: string
  gender: 'LAKI_LAKI' | 'PEREMPUAN'
  religion: string
  citizenship: string
  dailyLanguage: string
  childOrder: number
  totalSiblings: number
  // File uploads (stored as base64 or file paths)
  photoPath?: string
  birthCertificatePath?: string
  familyCardPath?: string
}

export interface PreviousSchoolData {
  type: 'TK' | 'SD' | 'SMP'
  schoolName: string
  city: string
  status: 'NEGERI' | 'SWASTA'
}

export interface RegistrationInfo {
  academicYear: string // e.g., "2026/2027"
  unit: 'SD' | 'SMP' | 'SMK'
  campus: string
  registrationWave: 'GELOMBANG_1' | 'GELOMBANG_2' | 'GELOMBANG_3'
  registrationPath: 'REGULER' | 'PRESTASI' | 'MUTASI' | 'BEASISWA'
  registrationType: 'SISWA_BARU' | 'PINDAHAN'
}

export interface AdditionalInfo {
  hasSpecialNeeds: boolean
  medicalHistory?: string
  allergies?: string
}

export interface SocialInfo {
  willDonate: boolean
  willBeFosterParent: boolean
  informationSources: string[] // ['GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'WEBSITE', 'SPANDUK', 'ALUMNI', 'LAINNYA']
}

export interface Enrollment {
  id: string
  
  // Registration Info
  registrationInfo: RegistrationInfo
  
  // Student Personal Data
  studentData: StudentPersonalData
  
  // Previous School
  previousSchool: PreviousSchoolData
  
  // Parents Data (Ayah & Ibu)
  parents: ParentData[]
  
  // Guardian (optional)
  guardian?: GuardianData
  
  // Additional Info
  additionalInfo: AdditionalInfo
  
  // Social Info (optional)
  socialInfo?: SocialInfo
  
  // Status & Timestamps
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt?: string
  verifiedAt?: string
  reviewNotes?: string
}

export interface AuthSession {
  sessionId: string
  user: {
    id: string
    username: string
    name: string
    role: string
  }
  token: string
  expiresAt: string
  createdAt: string
}

export type UnitType = 'SD' | 'SMP' | 'SMK' | 'YAYASAN'

export interface GalleryPhoto {
  id: string
  title: string
  description: string
  imageData: string // Can be base64 (legacy) or URL (new)
  imageUrl?: string // New field for URL-based storage (preferred)
  unit: UnitType
  category: string
  albumId?: string
  uploadedAt: string
  uploadedBy: string
  likes: string[]
  comments: PhotoComment[]
}

export interface GalleryCategory {
  id: string
  name: string
  unit: UnitType
}

export interface GalleryAlbum {
  id: string
  name: string
  description: string
  unit: UnitType
  coverPhotoId?: string
  createdAt: string
  eventDate?: string
}

export interface PhotoComment {
  id: string
  photoId: string
  userName: string
  userAvatar?: string
  comment: string
  createdAt: string
}

// ============================================
// CONTACT MESSAGE (Hubungi Kami)
// ============================================

export type ContactMessageStatus = 'NEW' | 'READ' | 'REPLIED'

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactMessageStatus
  createdAt: string
  updatedAt?: string
  repliedAt?: string
  adminNotes?: string
}
