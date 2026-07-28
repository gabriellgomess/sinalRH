import api from './api'

// Canal de Escuta — página pública (sem login).
// Nenhum token/cookie é necessário; endpoints têm rate-limit no backend.
export const escutaPublicoService = {
  async canal(slug) {
    const { data } = await api.get(`/publico/escuta/${slug}`)
    return data
  },

  async enviar(slug, payload) {
    const { data } = await api.post(`/publico/escuta/${slug}/relato`, payload)
    return data
  },

  // Protocolo sempre via POST (nunca na URL, para não vazar em logs/histórico)
  async acompanhar(protocolo) {
    const { data } = await api.post('/publico/escuta/acompanhar', { protocolo })
    return data
  },

  async responder(protocolo, texto) {
    const { data } = await api.post('/publico/escuta/acompanhar/responder', { protocolo, texto })
    return data
  }
}

// Comitê/conselho externo — acesso pelo token do link enviado por e-mail.
// Credencial distinta do protocolo do denunciante.
export const escutaComiteService = {
  async buscar(token) {
    const { data } = await api.get(`/publico/escuta/comite/${token}`)
    return data
  },

  async responder(token, texto) {
    const { data } = await api.post(`/publico/escuta/comite/${token}/mensagem`, { texto })
    return data
  },

  async atualizarStatus(token, status) {
    const { data } = await api.post(`/publico/escuta/comite/${token}/status`, { status })
    return data
  }
}
