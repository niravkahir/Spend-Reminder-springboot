
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

api.interceptors.request.use(
  (config) => {
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
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const url = error.config?.url || ''

    const isPublicAuthRequest =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register')

    if (
      error.response?.status === 401 &&
      !isPublicAuthRequest
    ) {
      localStorage.removeItem('spend_remainder_token')
      localStorage.removeItem('spend_remainder_user')

      const currentPath = window.location.pathname

      if (
        !currentPath.startsWith('/login') &&
        !currentPath.startsWith('/register')
      ) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  }
)

export const payload = (response) =>
  response?.data?.data

export const apiError = (error) => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The server may be waking up. Please try again.'
    }

    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your connection or try again shortly.'
    }
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong.'
  )
}

export default api
