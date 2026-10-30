import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spend_remainder_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('spend_remainder_token')
      localStorage.removeItem('spend_remainder_user')
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export const payload = (response) => response.data?.data
export const apiError = (error) => error.response?.data?.message || error.response?.data?.error || error.message || 'Something went wrong.'
export default api
