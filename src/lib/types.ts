export interface User {
  id: string
  username: string
  password: string
  role: string
  name: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  published: boolean
  authorId: string
  createdAt: string
}

export interface Enrollment {
  id: string
  fullName: string
  nik: string
  birthDate: string
  unit: string
  parentName: string
  phone: string
  address: string
  status: string
  createdAt: string
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
  imageData: string
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
