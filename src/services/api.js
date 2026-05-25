import axios from 'axios'

const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:8000/api'
  : 'https://sinalrh.saralinhar.com.br/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 40000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rp_user')
      localStorage.removeItem('rp_admin')
      localStorage.removeItem('rp_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
