/**
 * ═══════════════════════════════════════════════════════════════════
 * AUTH CONTEXT - Server-side session management
 * ═══════════════════════════════════════════════════════════════════
 * 
 * This replaces the localStorage-based auth with server-side sessions
 * 
 * ❌ NO localStorage for data
 * ❌ NO client-side password storage
 * ✅ Server-side sessions
 * ✅ HTTP-only cookies
 * ✅ API-based authentication
 * ═══════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { authApi, User, getAuthToken, clearAuthToken } from '@/lib/api'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setIsLoading(true)
    try {
      // Check if we have an existing session
      const token = getAuthToken()
      if (token) {
        const currentUser = await authApi.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        } else {
          clearAuthToken()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      clearAuthToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 Login attempt for:', username)
      
      const result = await authApi.login(username, password)
      
      if (result.user) {
        setUser(result.user)
        console.log('✅ Login successful!')
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      clearAuthToken()
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: user !== null,
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

// Legacy compatibility - session type that pages might expect
export interface AuthSession {
  sessionId: string
  user: User
  expiresAt: string
}
