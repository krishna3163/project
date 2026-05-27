/**
 * Auth context – manages JWT tokens in memory (not localStorage).
 * Tokens are stored in module-level variables to avoid XSS exposure.
 * On logout, all state is cleared and a full page reload happens.
 *
 * For production, consider moving to an HttpOnly cookie strategy
 * with a BFF layer to further reduce XSS token theft risk.
 */

/// <reference types="vite/client" />
import axios from 'axios'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

// In-memory token storage (not localStorage — safer against XSS)
let _accessToken: string | null = null
let _refreshToken: string | null = null

export function getAccessToken() { return _accessToken }

/** Axios instance with auth interceptor */
export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && _refreshToken) {
      original._retry = true
      try {
        const res = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken: _refreshToken })
        _accessToken = res.data.accessToken
        original.headers.Authorization = `Bearer ${_accessToken}`
        return api(original)
      } catch {
        clearTokens()
        globalThis.location.href = '/login'
      }
    }
    throw error
  }
)

function clearTokens() {
  _accessToken = null
  _refreshToken = null
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthUser {
  userId: string
  name: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)

  const sendOtp = useCallback(async (email: string) => {
    setLoading(true)
    try {
      await api.post('/api/auth/send-otp', { email })
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp })
      _accessToken = res.data.accessToken
      _refreshToken = res.data.refreshToken
      setUser({ userId: res.data.userId, name: res.data.name, email: res.data.email })
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    // Full reload clears all React state and cache
    globalThis.location.href = '/login'
  }, [])

  const value = useMemo(() => ({ user, loading, sendOtp, verifyOtp, logout }), [user, loading, sendOtp, verifyOtp, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
