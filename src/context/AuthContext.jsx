import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch, getAuthToken, setAuthToken } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    const token = getAuthToken()
    if (!token) { setLoading(false); return null }
    try {
      // Get full profile (with stats fields)
      const userData = await apiFetch('/user/profile')
      setUser(userData)
      return userData
    } catch (err) {
      console.error('Session invalid', err)
      setAuthToken(null)
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    fetchMe().finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    setAuthToken(data.token)
    await fetchMe()
  }

  const register = async (name, email, password, phone, ugOrPg) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, ...(phone ? { phone } : {}), ...(ugOrPg ? { ugOrPg } : {}) })
    })
    await login(email, password)
  }

  const logout = () => {
    setAuthToken(null)
    setUser(null)
  }

  const refetchUser = () => fetchMe()

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
