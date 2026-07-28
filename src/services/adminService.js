import api, { apiUrl } from './api'

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardService = {
  async getDashboard(params = {}) {
    const { data } = await api.get('/admin/dashboard', { params })
    return data
  },
  async getAlertas() {
    const { data } = await api.get('/admin/alertas')
    return data
  }
}

export const produtosContratadosService = {
  async listar() {
    const { data } = await api.get('/admin/produtos-contratados')
    return data
  }
}

// ── Cobranças (visão do cliente, somente leitura) ──────────────────────────
export const cobrancaAdminService = {
  async listar() {
    const { data } = await api.get('/admin/cobrancas')
    return data
  }
}

// ── Pesquisas ─────────────────────────────────────────────────────────────
export const pesquisaAdminService = {
  async listar(params = {}) {
    const { data } = await api.get('/admin/pesquisas', { params })
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/admin/pesquisas', payload)
    return data
  },
  async buscar(id) {
    const { data } = await api.get(`/admin/pesquisas/${id}`)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/pesquisas/${id}`, payload)
    return data
  },
  async excluir(id) {
    await api.delete(`/admin/pesquisas/${id}`)
  },
  async publicar(id) {
    const { data } = await api.post(`/admin/pesquisas/${id}/publicar`)
    return data
  },
  async encerrar(id) {
    const { data } = await api.post(`/admin/pesquisas/${id}/encerrar`)
    return data
  },
  async duplicar(id) {
    const { data } = await api.post(`/admin/pesquisas/${id}/duplicar`)
    return data
  },
  async getResultados(id) {
    const { data } = await api.get(`/admin/pesquisas/${id}/resultados`)
    return data
  },
  exportarUrl(id) {
    return `${api.defaults.baseURL}/admin/pesquisas/${id}/exportar`
  }
}

// ── Colaboradores ─────────────────────────────────────────────────────────
export const colaboradorService = {
  async listar(params = {}) {
    const { data } = await api.get('/admin/colaboradores', { params })
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/admin/colaboradores', payload)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/colaboradores/${id}`, payload)
    return data
  },
  async excluir(id) {
    await api.delete(`/admin/colaboradores/${id}`)
  },
  async enviarConvite(id) {
    const { data } = await api.post(`/admin/colaboradores/${id}/convite`)
    return data
  },
  async importar(arquivo) {
    const form = new FormData()
    form.append('arquivo', arquivo)
    // Content-Type: undefined remove o default 'application/json' da instância,
    // deixando o browser definir 'multipart/form-data; boundary=...' automaticamente
    const { data } = await api.post('/admin/colaboradores/importar', form, {
      headers: { 'Content-Type': undefined },
    })
    return data
  },
  async baixarTemplate() {
    const response = await api.get('/admin/colaboradores/template-csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo-colaboradores.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
  async exportar() {
    const response = await api.get('/admin/colaboradores/exportar', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'colaboradores.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}

// ── Riscos ────────────────────────────────────────────────────────────────
export const riscoService = {
  async listar(params = {}) {
    const { data } = await api.get('/admin/riscos', { params })
    return data
  },
  async buscarSetor(setorId, params = {}) {
    const { data } = await api.get(`/admin/riscos/${setorId}`, { params })
    return data
  },
  async salvarPlanoAcao(setorId, acoes) {
    const { data } = await api.post(`/admin/riscos/${setorId}/plano-acao`, { acoes })
    return data
  },
  async marcarRevisao(setorId) {
    const { data } = await api.post(`/admin/riscos/${setorId}/revisao`)
    return data
  },
  async recalcular() {
    const { data } = await api.post('/admin/riscos/recalcular')
    return data
  }
}

// ── Configurações ─────────────────────────────────────────────────────────
export const configuracaoService = {
  async buscar() {
    const { data } = await api.get('/admin/configuracoes')
    return data
  },
  async salvar(payload) {
    const { data } = await api.put('/admin/configuracoes', payload)
    return data
  }
}

// ── Relatórios ────────────────────────────────────────────────────────────
export const relatorioService = {
  async listar() {
    const { data } = await api.get('/admin/relatorios')
    return data
  },
  async buscar(id) {
    const { data } = await api.get(`/admin/relatorios/${id}`)
    return data
  },
  async gerar(periodo, tipo = 'executivo') {
    const { data } = await api.post('/admin/relatorios/gerar', { periodo, tipo })
    return data
  },
  async baixarPdf(id) {
    const response = await api.get(`/admin/relatorios/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
  async enviarEmail(id, emails) {
    const { data } = await api.post(`/admin/relatorios/${id}/enviar`, { emails })
    return data
  }
}

// ── Check-ins ────────────────────────────────────────────────────────────
export const checkInAdminService = {
  async resumo() {
    const { data } = await api.get('/admin/checkins/resumo')
    return data
  },
  async listar(params = {}) {
    const { data } = await api.get('/admin/checkins', { params })
    return data
  },
  async porSemana(semana) {
    const { data } = await api.get(`/admin/checkins/semana/${semana}`)
    return data
  }
}

// ── Setores ───────────────────────────────────────────────────────────────
export const setorService = {
  async listar() {
    const { data } = await api.get('/admin/setores')
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/admin/setores', payload)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/setores/${id}`, payload)
    return data
  },
  async excluir(id) {
    await api.delete(`/admin/setores/${id}`)
  }
}

// ── Usuários ───────────────────────────────────────────────────────────────
export const usuarioService = {
  async listar() {
    const { data } = await api.get('/admin/usuarios')
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/admin/usuarios', payload)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/usuarios/${id}`, payload)
    return data
  },
  async remover(id) {
    const { data } = await api.delete(`/admin/usuarios/${id}`)
    return data
  },
  // Funcionários que ainda não têm acesso ao painel
  async colaboradoresElegiveis() {
    const { data } = await api.get('/admin/usuarios/colaboradores-elegiveis')
    return data
  },
  async promover(payload) {
    const { data } = await api.post('/admin/usuarios/promover', payload)
    return data
  }
}

// ── Permissões por perfil ─────────────────────────────────────────────────
export const permissaoService = {
  async buscar() {
    const { data } = await api.get('/admin/permissoes')
    return data
  },
  // A empresa só pode restringir o padrão definido na Plataforma
  async salvarMatriz(matriz) {
    const { data } = await api.put('/admin/permissoes', { matriz })
    return data
  }
}

// ── Empresa ───────────────────────────────────────────────────────────────
export const empresaService = {
  async buscar() {
    const { data } = await api.get('/admin/empresas')
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/empresas/${id}`, payload)
    return data
  }
}

// ── Escuta (admin) ────────────────────────────────────────────────────────
export const escutaAdminService = {
  async listar(params = {}) {
    const { data } = await api.get('/admin/escuta', { params })
    return data
  },
  async buscar(id) {
    const { data } = await api.get(`/admin/escuta/${id}`)
    return data
  },
  async atualizarStatus(id, status) {
    const { data } = await api.put(`/admin/escuta/${id}/status`, { status })
    return data
  },
  async adicionarNota(id, nota) {
    const { data } = await api.post(`/admin/escuta/${id}/nota`, { nota })
    return data
  },
  async assumir(id) {
    const { data } = await api.post(`/admin/escuta/${id}/assumir`)
    return data
  },
  // Resposta visível ao denunciante na página pública de acompanhamento
  async adicionarMensagem(id, texto) {
    const { data } = await api.post(`/admin/escuta/${id}/mensagem`, { texto })
    return data
  },
  // ── Link público de relato anônimo (somente role admin) ──
  async configPublico() {
    const { data } = await api.get('/admin/escuta/publico/config')
    return data
  },
  async ativarPublico() {
    const { data } = await api.post('/admin/escuta/publico/ativar')
    return data
  },
  async desativarPublico() {
    const { data } = await api.post('/admin/escuta/publico/desativar')
    return data
  },
  async regenerarSlug() {
    const { data } = await api.post('/admin/escuta/publico/regenerar-slug')
    return data
  }
}

// ── EAD / Treinamentos (empresa: visualização + índices) ───────────────────
export const eadAdminService = {
  async listarCursos() {
    const { data } = await api.get('/admin/ead/cursos')
    return data
  },
  async visualizarCurso(cursoId) {
    const { data } = await api.get(`/admin/ead/cursos/${cursoId}/visualizar`)
    return data
  },
  async buscarAula(aulaId) {
    const { data } = await api.get(`/admin/ead/aulas/${aulaId}`)
    return data.data
  },
  videoUrl(aulaId) {
    return apiUrl(`/admin/ead/aulas/${aulaId}/video`)
  },
  anexoUrl(aulaId, anexoId) {
    return apiUrl(`/admin/ead/aulas/${aulaId}/anexos/${anexoId}`)
  },
  anexoVerUrl(aulaId, anexoId) {
    return apiUrl(`/admin/ead/aulas/${aulaId}/anexos/${anexoId}/ver`)
  },
  async buscarTeste(testeId) {
    const { data } = await api.get(`/admin/ead/testes/${testeId}`)
    return data
  },
  async simularTeste(testeId, respostas) {
    const { data } = await api.post(`/admin/ead/testes/${testeId}/simular`, { respostas })
    return data
  },
  // Índices (F6)
  async resultados(cursoId, setorId) {
    const params = setorId ? { setor_id: setorId } : {}
    const { data } = await api.get(`/admin/ead/cursos/${cursoId}/resultados`, { params })
    return data
  },
  exportarUrl(cursoId, setorId) {
    const q = setorId ? `?setor_id=${setorId}` : ''
    return apiUrl(`/admin/ead/cursos/${cursoId}/resultados/exportar${q}`)
  },
}

// ── Comunicados (feature liberada por padrão, não é produto) ────────────────
export const comunicadoAdminService = {
  async listar() {
    const { data } = await api.get('/admin/comunicados')
    return data
  },
  async criar(payload) {
    const { data } = await api.post('/admin/comunicados', payload)
    return data
  },
  async atualizar(id, payload) {
    const { data } = await api.put(`/admin/comunicados/${id}`, payload)
    return data
  },
  async publicar(id) {
    const { data } = await api.post(`/admin/comunicados/${id}/publicar`)
    return data
  },
  async remover(id) {
    await api.delete(`/admin/comunicados/${id}`)
  },
}
