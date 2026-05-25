import api from './api'

// ── Admin: gestão de avaliações NR-1 ─────────────────────────────────────
export const nr1AdminService = {
  async listar() {
    const { data } = await api.get('/admin/nr1')
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/admin/nr1', payload)
    return data
  },

  async buscar(id) {
    const { data } = await api.get(`/admin/nr1/${id}`)
    return data
  },

  async publicar(id) {
    const { data } = await api.post(`/admin/nr1/${id}/publicar`)
    return data
  },

  async encerrar(id) {
    const { data } = await api.post(`/admin/nr1/${id}/encerrar`)
    return data
  },

  async resultados(id, filtros = {}) {
    const { data } = await api.get(`/admin/nr1/${id}/resultados`, { params: filtros })
    return data
  },

  async excluir(id) {
    const { data } = await api.delete(`/admin/nr1/${id}`)
    return data
  },

  async baixarPdf(id, filtros = {}, nomeArquivo = `pgr-nr1-${id}.pdf`) {
    const response = await api.get(`/admin/nr1/${id}/pdf`, {
      params: filtros,
      responseType: 'blob',
      timeout: 90000, // 90s
    })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  async planoAcao(id) {
    const { data } = await api.get(`/admin/nr1/${id}/plano-acao`)
    return data
  },

  async criarAcao(id, payload) {
    const { data } = await api.post(`/admin/nr1/${id}/plano-acao`, payload)
    return data
  },

  async atualizarAcao(avaliacaoId, acaoId, payload) {
    const { data } = await api.put(`/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}`, payload)
    return data
  },

  async excluirAcao(avaliacaoId, acaoId) {
    const { data } = await api.delete(`/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}`)
    return data
  },

  async aprovar(id, payload) {
    const { data } = await api.post(`/admin/nr1/${id}/aprovar`, payload)
    return data
  },

  async duplicar(id) {
    const { data } = await api.post(`/admin/nr1/${id}/duplicar`)
    return data
  },

  async listarAnexos(avaliacaoId, acaoId) {
    const { data } = await api.get(`/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}/anexos`)
    return data
  },

  async uploadAnexo(avaliacaoId, acaoId, file, descricao = '') {
    const form = new FormData()
    form.append('arquivo', file)
    if (descricao) form.append('descricao', descricao)
    const { data } = await api.post(
      `/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}/anexos`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  async excluirAnexo(avaliacaoId, acaoId, anexoId) {
    const { data } = await api.delete(`/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}/anexos/${anexoId}`)
    return data
  },

  async baixarAnexo(avaliacaoId, acaoId, anexoId, nomeArquivo) {
    const response = await api.get(
      `/admin/nr1/${avaliacaoId}/plano-acao/${acaoId}/anexos/${anexoId}`,
      { responseType: 'blob' }
    )
    const url = URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  async historico(id) {
    const { data } = await api.get(`/admin/nr1/${id}/historico`)
    return data
  },

  // ── Dossie de auditoria ────────────────────────────────────────────────
  async dossieArvore(avaliacaoId) {
    const { data } = await api.get(`/admin/nr1/${avaliacaoId}/dossie`)
    return data
  },

  async dossieListarPasta(avaliacaoId, pastaCodigo, subpasta = null) {
    const params = subpasta ? { subpasta } : {}
    const { data } = await api.get(`/admin/nr1/${avaliacaoId}/dossie/${pastaCodigo}`, { params })
    return data
  },

  async dossieUpload(avaliacaoId, pastaCodigo, file, subpasta = null, descricao = '') {
    const form = new FormData()
    form.append('arquivo', file)
    if (subpasta) form.append('subpasta', subpasta)
    if (descricao) form.append('descricao', descricao)
    const { data } = await api.post(
      `/admin/nr1/${avaliacaoId}/dossie/${pastaCodigo}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  async dossieExcluirArquivo(avaliacaoId, arquivoId) {
    const { data } = await api.delete(`/admin/nr1/${avaliacaoId}/dossie/arquivos/${arquivoId}`)
    return data
  },

  async dossieBaixarArquivo(avaliacaoId, arquivoId, nomeArquivo) {
    const response = await api.get(
      `/admin/nr1/${avaliacaoId}/dossie/arquivos/${arquivoId}`,
      { responseType: 'blob' }
    )
    const url = URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  async dossieSubpastasMensais(avaliacaoId) {
    const { data } = await api.get(`/admin/nr1/${avaliacaoId}/dossie/subpastas-mensais`)
    return data
  },

  async dossieBaixarZip(avaliacaoId, codigo, versao) {
    const response = await api.get(`/admin/nr1/${avaliacaoId}/dossie/zip`, {
      responseType: 'blob',
      timeout: 120000, // 120s
    })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `dossie-pgr-${codigo}-v${versao ?? '1.0'}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  async gerarRelatorioIA(id) {
    const { data } = await api.post(`/admin/nr1/${id}/gerar-ia`, {}, { timeout: 120000 }) // 120s
    return data
  },

  async obterRelatorioIA(id) {
    const { data } = await api.get(`/admin/nr1/${id}/ia`, {
      params: { _t: Date.now() }
    })
    return data
  },
}

// ── Público: fluxo anônimo de resposta ────────────────────────────────────
export const nr1PublicoService = {
  async buscarPorCodigo(codigo) {
    const { data } = await api.get(`/nr1/${codigo}`)
    return data
  },

  async responder(codigo, payload) {
    const { data } = await api.post(`/nr1/${codigo}/responder`, payload)
    return data
  },
}
