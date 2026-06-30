import axios from 'axios'

const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:8000/api'
  : 'https://sinalrh.saralinhar.com.br/api'

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

export default api
