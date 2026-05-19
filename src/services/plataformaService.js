import api from './api'

export const plataformaDashboardService = {
  async get() {
    const { data } = await api.get('/plataforma/dashboard')
    return data
  }
}

export const plataformaEmpresaService = {
  async listar(params = {}) {
    const { data } = await api.get('/plataforma/empresas', { params })
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/plataforma/empresas', payload)
    return data
  },
  async buscar(id) {
    const { data } = await api.get(`/plataforma/empresas/${id}`)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/plataforma/empresas/${id}`, payload)
    return data
  },
  async cancelar(id) {
    const { data } = await api.delete(`/plataforma/empresas/${id}`)
    return data
  }
}

export const plataformaProdutoService = {
  async listar(empresaId) {
    const { data } = await api.get(`/plataforma/empresas/${empresaId}/produtos`)
    return data
  },
  async contratar(empresaId, payload) {
    const { data } = await api.post(`/plataforma/empresas/${empresaId}/produtos`, payload)
    return data
  },
  async atualizar(empresaId, produtoId, payload) {
    const { data } = await api.put(`/plataforma/empresas/${empresaId}/produtos/${produtoId}`, payload)
    return data
  },
  async remover(empresaId, produtoId) {
    const { data } = await api.delete(`/plataforma/empresas/${empresaId}/produtos/${produtoId}`)
    return data
  },
}
