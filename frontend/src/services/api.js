
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000
})

// Login and registration must not send an old/stale JWT.
api.interceptors.request.use((config) => {
  const url = config.url || ''

  const isPublicAuthRequest =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register')

  if (isPublicAuthRequest) {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization
    }

    return config
  }

  const token = localStorage.getItem('spend_remainder_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization
  }

  return config
})

// Handle API errors
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const url = error.config?.url || ''

    const isPublicAuthRequest =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register')

    // A failed login should not clear the current state
    // or trigger an automatic redirect.
    if (
      error.response?.status === 401 &&
      !isPublicAuthRequest
    ) {
      localStorage.removeItem('spend_remainder_token')
      localStorage.removeItem('spend_remainder_user')

      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  }
)

// Extract data from the standard ApiResponse wrapper
export const payload = (response) =>
  response?.data?.data

// Extract readable error messages
export const apiError = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Something went wrong.'

export default api
