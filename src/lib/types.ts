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
  unit: 'SD' | 'SMP' | 'SMK'
  parentName: string
  phone: string
  address: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface AuthSession {
  userId: string
  username: string
  name: string
  role: string
}
