import api, { apiUrl } from './api'

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
  async enviar(modo, categoria, tag, texto, tipoEnvolvido) {
    const { data } = await api.post('/app/escuta', { modo, categoria, tag, texto, tipo_envolvido: tipoEnvolvido })
    return data
  }
}

// ── EAD / Treinamentos (colaborador) ───────────────────────────────────────
export const eadService = {
  async listarCursos() {
    const { data } = await api.get('/app/ead/cursos')
    return data.cursos
  },
  async buscarCurso(cursoId) {
    const { data } = await api.get(`/app/ead/cursos/${cursoId}`)
    return data
  },
  async buscarAula(aulaId) {
    const { data } = await api.get(`/app/ead/aulas/${aulaId}`)
    return data.data
  },
  videoUrl(aulaId) {
    return apiUrl(`/app/ead/aulas/${aulaId}/video`)
  },
  anexoUrl(aulaId, anexoId) {
    return apiUrl(`/app/ead/aulas/${aulaId}/anexos/${anexoId}`)
  },
  async concluirAula(aulaId, segundos) {
    const { data } = await api.post(`/app/ead/aulas/${aulaId}/concluir`, { segundos })
    return data
  },
  async buscarTeste(testeId) {
    const { data } = await api.get(`/app/ead/testes/${testeId}`)
    return data
  },
  async responderTeste(testeId, respostas) {
    const { data } = await api.post(`/app/ead/testes/${testeId}/responder`, { respostas })
    return data
  },
}
