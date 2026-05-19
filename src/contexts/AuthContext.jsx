import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('rp_user')
    const storedAdmin = localStorage.getItem('rp_admin')
    if (storedUser) setUser(JSON.parse(storedUser))
    if (storedAdmin) setAdmin(JSON.parse(storedAdmin))
    setLoading(false)
  }, [])

  async function loginColaborador(login, senha) {
    try {
      const data = await authService.loginColaborador(login, senha)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors?.login?.[0] || errors?.senha?.[0]
        || err.response?.data?.message
        || 'Credenciais inválidas.'
      return { success: false, error: msg }
    }
  }

  async function loginAdmin(email, senha) {
    try {
      const data = await authService.loginAdmin(email, senha)
      setAdmin(data.user)
      return { success: true, tipo: data.tipo }
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors?.email?.[0]
        || err.response?.data?.message
        || 'Credenciais inválidas.'
      return { success: false, error: msg }
    }
  }

  // Chamado após cadastro self-service (token já está no localStorage)
  loginAdmin._afterCadastro = function (data) {
    setAdmin(data.user)
  }

  async function marcarOnboardingConcluido() {
    try {
      await authService.concluirOnboarding()
      setAdmin(prev => prev ? { ...prev, onboarding_concluido: true } : prev)
    } catch (_) {
      // silencia — o wizard some localmente de qualquer forma
      setAdmin(prev => prev ? { ...prev, onboarding_concluido: true } : prev)
    }
  }

  async function logoutColaborador() {
    try { await authService.logout() } catch (_) {}
    setUser(null)
  }

  async function logoutAdmin() {
    try { await authService.logout() } catch (_) {}
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginColaborador, loginAdmin, logoutColaborador, logoutAdmin, marcarOnboardingConcluido }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
