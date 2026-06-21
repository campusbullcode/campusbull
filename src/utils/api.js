export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

export const getAuthToken = () => {
  return localStorage.getItem('token')
}

// In production (Vercel), VITE_API_URL = https://your-render-app.onrender.com
// In development, it's empty so Vite's proxy handles /api → localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || ''

// Helper for making API calls with the JWT token
export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  })

  // Automatically handle 401s by logging out
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
    setAuthToken(null)
  }

  const data = await response.json().catch(() => null)
  
  if (!response.ok) {
    const err = new Error(data?.error || `API request failed with status ${response.status}`)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

