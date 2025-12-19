import bcrypt from 'bcryptjs'
import { AuthSession, User } from './types'
import { getDatabase } from './db'

const SESSION_DURATION_HOURS = 24
const BCRYPT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function createSession(user: User): Promise<AuthSession> {
  const sessionId = generateSessionId()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)
  
  const session: AuthSession = {
    sessionId,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    token: sessionId,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  }

  const db = getDatabase()
  await db.set(`session:${sessionId}`, session)
  console.log('✅ Session created:', sessionId)
  
  return session
}

export async function validateSession(sessionId: string): Promise<AuthSession | null> {
  if (!sessionId) return null
  
  const db = getDatabase()
  const session = await db.get<AuthSession>(`session:${sessionId}`)
  
  if (!session) return null
  
  const expiresAt = new Date(session.expiresAt)
  const now = new Date()
  
  if (expiresAt < now) {
    await destroySession(sessionId)
    return null
  }
  
  return session
}

export async function destroySession(sessionId: string): Promise<void> {
  const db = getDatabase()
  await db.delete(`session:${sessionId}`)
}

export async function initializeDefaultUser(): Promise<void> {
  const db = getDatabase()
  const users = await db.getUsers() || []
  
  console.log('📊 Initializing users... Current users:', users.length)
  
  if (users.length === 0) {
    const hashedPassword = await hashPassword('admin123')
    const defaultUser: User = {
      id: generateId(),
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Administrator',
      createdAt: new Date().toISOString()
    }
    
    await db.saveUsers([defaultUser])
    console.log('✅ Admin user initialized')
    console.log('Username: admin')
    console.log('Password: admin123')
    console.log('Stored user:', { username: defaultUser.username, role: defaultUser.role })
  } else {
    console.log('✅ Users already exist:', users.map(u => u.username))
  }
}

export function getSessionIdFromStorage(): string | null {
  return localStorage.getItem('sessionId')
}

export function setSessionIdToStorage(sessionId: string): void {
  localStorage.setItem('sessionId', sessionId)
}

export function clearSessionIdFromStorage(): void {
  localStorage.removeItem('sessionId')
}
