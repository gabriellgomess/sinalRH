import api from './api'

export const authService = {
  async loginColaborador(login, senha) {
    const { data } = await api.post('/auth/colaborador/login', { login, senha })
    localStorage.setItem('srh_tipo', data.tipo)
    localStorage.setItem('srh_user', JSON.stringify(data.user))
    return data
  },

  async loginAdmin(email, senha) {
    const { data } = await api.post('/auth/admin/login', { email, senha })
    localStorage.setItem('srh_tipo', data.tipo)
    localStorage.setItem('srh_admin', JSON.stringify(data.user))
    return data
  },

  async cadastrarEmpresa(payload) {
    const { data } = await api.post('/cadastro', payload)
    localStorage.setItem('srh_tipo', data.tipo)
    localStorage.setItem('srh_admin', JSON.stringify(data.user))
    return data
  },

  async concluirOnboarding() {
    await api.post('/admin/configuracoes/onboarding')
    const stored = localStorage.getItem('srh_admin')
    if (stored) {
      const admin = JSON.parse(stored)
      admin.onboarding_concluido = true
      localStorage.setItem('srh_admin', JSON.stringify(admin))
    }
  },

  async cadastrarSetoresOnboarding(setores) {
    const { data } = await api.post('/cadastro/setores', { setores })
    return data
  },

  async enviarConvitesOnboarding(convites, setorId = null) {
    const { data } = await api.post('/cadastro/convites', { convites, setor_id: setorId })
    return data
  },

  async validarConviteColaborador(token) {
    const { data } = await api.get(`/auth/colaborador/convite/${token}`)
    return data
  },

  async aceitarConviteColaborador(token, senha, senha_confirmation) {
    const { data } = await api.post(`/auth/colaborador/convite/${token}`, {
      senha,
      senha_confirmation,
    })
    return data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('srh_tipo')
      localStorage.removeItem('srh_user')
      localStorage.removeItem('srh_admin')
    }
  },

  async me() {
    const { data } = await api.get('/auth/me')
    return data.user
  }
}
