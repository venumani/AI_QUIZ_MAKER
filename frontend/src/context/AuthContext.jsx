import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quiz_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('quiz_token')
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('quiz_user', JSON.stringify(res.data))
        })
        .catch(() => {
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('quiz_token', access_token)
    localStorage.setItem('quiz_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (userData) => {
    const res = await authAPI.register(userData)
    const { access_token, user: registeredUser } = res.data
    localStorage.setItem('quiz_token', access_token)
    localStorage.setItem('quiz_user', JSON.stringify(registeredUser))
    setUser(registeredUser)
    return registeredUser
  }

  const logout = () => {
    localStorage.removeItem('quiz_token')
    localStorage.removeItem('quiz_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
