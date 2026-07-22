import api, { apiUrl } from './api'

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

// Produtos = ACESSO/funcionalidade (sem cobranca)
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

// Cobrancas = financeiro (avulsas, atreladas a empresa/customer Asaas)
export const plataformaCobrancaService = {
  async listar(empresaId) {
    const { data } = await api.get(`/plataforma/empresas/${empresaId}/cobrancas`)
    return data
  },
  async criar(empresaId, payload) {
    const { data } = await api.post(`/plataforma/empresas/${empresaId}/cobrancas`, payload)
    return data
  },
  async atualizar(empresaId, cobrancaId, payload) {
    const { data } = await api.put(`/plataforma/empresas/${empresaId}/cobrancas/${cobrancaId}`, payload)
    return data
  },
  async remover(empresaId, cobrancaId) {
    const { data } = await api.delete(`/plataforma/empresas/${empresaId}/cobrancas/${cobrancaId}`)
    return data
  },
  async sincronizarAsaas(empresaId, cobrancaId) {
    const { data } = await api.post(`/plataforma/empresas/${empresaId}/cobrancas/${cobrancaId}/sincronizar-asaas`)
    return data
  },
}

// ── EAD / Treinamentos (Plataforma cria e libera cursos) ───────────────────
export const plataformaEadService = {
  // Cursos
  async listarCursos() {
    const { data } = await api.get('/plataforma/ead/cursos')
    return data
  },
  async criarCurso(payload) {
    const { data } = await api.post('/plataforma/ead/cursos', payload)
    return data
  },
  async buscarCurso(id) {
    const { data } = await api.get(`/plataforma/ead/cursos/${id}`)
    return data
  },
  async atualizarCurso(id, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${id}`, payload)
    return data
  },
  async excluirCurso(id) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${id}`)
    return data
  },
  async publicarCurso(id) {
    const { data } = await api.post(`/plataforma/ead/cursos/${id}/publicar`)
    return data
  },
  async arquivarCurso(id) {
    const { data } = await api.post(`/plataforma/ead/cursos/${id}/arquivar`)
    return data
  },
  async duplicarCurso(id) {
    const { data } = await api.post(`/plataforma/ead/cursos/${id}/duplicar`)
    return data
  },

  // Modulos
  async criarModulo(cursoId, payload) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/modulos`, payload)
    return data
  },
  async atualizarModulo(cursoId, moduloId, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}`, payload)
    return data
  },
  async excluirModulo(cursoId, moduloId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}`)
    return data
  },
  async reordenarModulos(cursoId, ordem) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/modulos/reordenar`, { ordem })
    return data
  },

  // Aulas
  async criarAula(cursoId, moduloId, payload) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas`, payload)
    return data
  },
  async atualizarAula(cursoId, moduloId, aulaId, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}`, payload)
    return data
  },
  async excluirAula(cursoId, moduloId, aulaId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}`)
    return data
  },
  async reordenarAulas(cursoId, moduloId, ordem) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/reordenar`, { ordem })
    return data
  },

  // Liberacao por empresa
  async listarEmpresas(cursoId) {
    const { data } = await api.get(`/plataforma/ead/cursos/${cursoId}/empresas`)
    return data
  },
  async liberarEmpresas(cursoId, empresas) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/empresas`, { empresas })
    return data
  },
  async atualizarLiberacao(cursoId, empresaId, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${cursoId}/empresas/${empresaId}`, payload)
    return data
  },
  async removerLiberacao(cursoId, empresaId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/empresas/${empresaId}`)
    return data
  },

  // Video em chunks (10 MB). onProgress recebe 0..100.
  async enviarVideo(cursoId, moduloId, aulaId, file, onProgress) {
    const CHUNK = 10 * 1024 * 1024
    const total = Math.max(1, Math.ceil(file.size / CHUNK))
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const base = `/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}/video`
    let ultimo = null
    for (let i = 0; i < total; i++) {
      const blob = file.slice(i * CHUNK, (i + 1) * CHUNK)
      const fd = new FormData()
      fd.append('chunk', blob)
      fd.append('upload_id', uploadId)
      fd.append('indice', String(i))
      fd.append('total', String(total))
      fd.append('filename', file.name)
      const { data } = await api.post(base, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      ultimo = data
      if (onProgress) onProgress(data.done ? 100 : (data.progresso ?? Math.round(((i + 1) / total) * 100)))
    }
    return ultimo
  },

  // Anexos (imagens e documentos)
  async listarAnexos(cursoId, moduloId, aulaId) {
    const { data } = await api.get(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}/anexos`)
    return data
  },
  async enviarAnexo(cursoId, moduloId, aulaId, file) {
    const fd = new FormData()
    fd.append('arquivo', file)
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}/anexos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  },
  async removerAnexo(cursoId, moduloId, aulaId, anexoId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/modulos/${moduloId}/aulas/${aulaId}/anexos/${anexoId}`)
    return data
  },

  // Testes de aptidao
  async listarTestes(cursoId) {
    const { data } = await api.get(`/plataforma/ead/cursos/${cursoId}/testes`)
    return data
  },
  async buscarTeste(cursoId, testeId) {
    const { data } = await api.get(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}`)
    return data
  },
  async criarTeste(cursoId, payload) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/testes`, payload)
    return data
  },
  async atualizarTeste(cursoId, testeId, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}`, payload)
    return data
  },
  async excluirTeste(cursoId, testeId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}`)
    return data
  },
  async criarPergunta(cursoId, testeId, payload) {
    const { data } = await api.post(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}/perguntas`, payload)
    return data
  },
  async atualizarPergunta(cursoId, testeId, perguntaId, payload) {
    const { data } = await api.put(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}/perguntas/${perguntaId}`, payload)
    return data
  },
  async excluirPergunta(cursoId, testeId, perguntaId) {
    const { data } = await api.delete(`/plataforma/ead/cursos/${cursoId}/testes/${testeId}/perguntas/${perguntaId}`)
    return data
  },

  // Indices consolidados
  async resultados(cursoId, empresaId) {
    const params = empresaId ? { empresa_id: empresaId } : {}
    const { data } = await api.get(`/plataforma/ead/cursos/${cursoId}/resultados`, { params })
    return data
  },
  exportarUrl(cursoId, empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : ''
    return apiUrl(`/plataforma/ead/cursos/${cursoId}/resultados/exportar${q}`)
  },
}
