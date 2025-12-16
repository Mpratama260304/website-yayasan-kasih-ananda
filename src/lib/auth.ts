import { AuthSession, User } from './types'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'kasih-ananda-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export function createSession(user: User): AuthSession {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  
  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    token: generateId(),
    expiresAt: expiresAt.toISOString()
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
