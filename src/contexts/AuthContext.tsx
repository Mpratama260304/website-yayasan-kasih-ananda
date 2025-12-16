import { createContext, useContext, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { AuthSession, User } from '@/lib/types'
import { verifyPassword, createSession, hashPassword } from '@/lib/auth'

interface AuthContextType {
  session: AuthSession | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useKV<AuthSession | null>('auth-session', null)
  const [users] = useKV<User[]>('users', [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const user = (users || []).find(u => u.username === username)
    
    if (!user) {
      return false
    }

    const isValid = await verifyPassword(password, user.password)
    
    if (isValid) {
      const newSession = createSession(user)
      setSession(newSession)
      return true
    }
    
    return false
  }

  const logout = () => {
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session: session || null,
      login,
      logout,
      isAuthenticated: session !== null && session !== undefined
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
