import axios from 'axios'

const defaultApiUrl = import.meta.env.DEV
  ? '/api'
  : 'https://api.saralinhar.com.br/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 40000,
  withCredentials: true
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('srh_user')
      localStorage.removeItem('srh_admin')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Monta URL absoluta para recursos servidos pela API que dependem do cookie
// de sessao (ex.: <video src>, download de anexos). Em dev usa o proxy /api.
export function apiUrl(path) {
  const base = api.defaults.baseURL || '/api'
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${base}${clean}`
}

export default api
