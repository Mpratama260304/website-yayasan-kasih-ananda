import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { AuthSession, User } from '@/lib/types'
import { 
  verifyPassword, 
  createSession, 
  validateSession,
  destroySession,
  getSessionIdFromStorage,
  setSessionIdToStorage,
  clearSessionIdFromStorage,
  initializeDefaultUser
} from '@/lib/auth'

interface AuthContextType {
  session: AuthSession | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setIsLoading(true)
    try {
      await initializeDefaultUser()
      
      const sessionId = getSessionIdFromStorage()
      if (sessionId) {
        const validSession = await validateSession(sessionId)
        if (validSession) {
          setSession(validSession)
        } else {
          clearSessionIdFromStorage()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      clearSessionIdFromStorage()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const users = await window.spark.kv.get<User[]>('users') || []
      const user = users.find(u => u.username === username)
      
      if (!user) {
        return false
      }

      const isValid = await verifyPassword(password, user.password)
      
      if (isValid) {
        const newSession = await createSession(user)
        setSession(newSession)
        setSessionIdToStorage(newSession.sessionId)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      if (session) {
        await destroySession(session.sessionId)
      }
      setSession(null)
      clearSessionIdFromStorage()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      session,
      login,
      logout,
      isAuthenticated: session !== null,
      isLoading
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
