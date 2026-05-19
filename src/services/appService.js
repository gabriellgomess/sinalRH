import api from './api'

// ── Área do Colaborador ───────────────────────────────────────────────────

export const homeService = {
  async getHome() {
    const { data } = await api.get('/app/home')
    return data
  },
  async getPerfil() {
    const { data } = await api.get('/app/perfil')
    return data
  }
}

export const checkinService = {
  async getAtual() {
    const { data } = await api.get('/app/checkin/atual')
    return data
  },
  async enviar(humor, comentario, anonimo = false) {
    const { data } = await api.post('/app/checkin', { humor, comentario, anonimo })
    return data
  },
  async getHistorico() {
    const { data } = await api.get('/app/checkin/historico')
    return data
  }
}

export const pesquisaAppService = {
  async listar() {
    const { data } = await api.get('/app/pesquisas')
    return data.pesquisas
  },
  async buscar(id) {
    const { data } = await api.get(`/app/pesquisas/${id}`)
    return data
  },
  async responder(id, respostas) {
    const { data } = await api.post(`/app/pesquisas/${id}/responder`, { respostas })
    return data
  }
}

export const comunicadoService = {
  async listar() {
    const { data } = await api.get('/app/comunicados')
    return data
  },
  async marcarLido(id) {
    const { data } = await api.post(`/app/comunicados/${id}/ler`)
    return data
  }
}

export const escutaService = {
  async enviar(modo, categoria, tag, texto) {
    const { data } = await api.post('/app/escuta', { modo, categoria, tag, texto })
    return data
  }
}
