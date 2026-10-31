import { createContext, useContext, useMemo, useState } from 'react'
import api, { payload } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spend_remainder_user') || 'null')
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() =>
    localStorage.getItem('spend_remainder_token')
  )

  const login = async (credentials) => {
    const result = payload(await api.post('/api/auth/login', credentials))

    localStorage.setItem('spend_remainder_token', result.token)

    const nextUser = {
      username: result.username,
      name: result.name,
      email: result.email,
      role: result.role
    }

    localStorage.setItem('spend_remainder_user', JSON.stringify(nextUser))

    setToken(result.token)
    setUser(nextUser)

    return nextUser
  }

  const register = async (details) =>
    payload(await api.post('/api/auth/register', details))

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {}

    localStorage.removeItem('spend_remainder_token')
    localStorage.removeItem('spend_remainder_user')

    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)