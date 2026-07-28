import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Search, Send, Clock, MessageSquare } from 'lucide-react'
import { escutaPublicoService } from '../../services/escutaPublicoService'

const statusLabels = {
  pendente:   { label: 'Recebido', desc: 'Seu relato foi registrado e está na fila do grupo responsável.' },
  em_analise: { label: 'Em análise', desc: 'O grupo responsável está apurando o seu relato.' },
  resolvido:  { label: 'Resolvido', desc: 'A apuração foi concluída.' },
  arquivado:  { label: 'Encerrado', desc: 'Este relato foi encerrado e não aceita novas mensagens.' }
}

export default function EscutaAcompanhar() {
  const [protocolo, setProtocolo] = useState('')
  const [relato, setRelato] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function consultar(e) {
    e?.preventDefault()
    if (!protocolo.trim()) return
    setLoading(true)
    setError('')
    setRelato(null)
    try {
      const data = await escutaPublicoService.acompanhar(protocolo.trim().toUpperCase())
      setRelato(data)
    } catch (err) {
      setError(err.response?.status === 429
        ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
        : 'Protocolo não encontrado. Confira os caracteres e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function enviarResposta() {
    if (!resposta.trim()) return
    setEnviando(true)
    try {
      await escutaPublicoService.responder(relato.protocolo, resposta)
      setResposta('')
      const data = await escutaPublicoService.acompanhar(relato.protocolo)
      setRelato(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível enviar a mensagem.')
    } finally {
      setEnviando(false)
    }
  }

  const info = relato ? (statusLabels[relato.status] || statusLabels.pendente) : null

  return (
    <div className="min-h-screen bg-rp-cinza-claro flex flex-col">
      <div className="bg-white px-5 pt-6 pb-4 border-b border-rp-cinza-borda">
        <h1 className="text-xl font-bold text-rp-azul">Acompanhar relato</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">Canal de Escuta · Anônimo</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg w-full mx-auto">
        <form onSubmit={consultar} className="bg-white rounded-2xl p-4 border border-rp-cinza-borda">
          <label className="block text-xs font-semibold text-rp-texto mb-2">
            Informe o protocolo recebido ao enviar o relato
          </label>
          <div className="flex gap-2">
            <input
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value.toUpperCase())}
              placeholder="ESC-XXXXX-XXXXX"
              className="input-field font-mono flex-1"
            />
            <button
              type="submit"
              disabled={!protocolo.trim() || loading}
              className="bg-rp-azul text-white font-semibold rounded-xl px-4 text-sm disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Search size={16} />
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </form>

        {relato && (
          <>
            <div className="bg-white rounded-2xl p-4 border border-rp-cinza-borda">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rp-azul-suave flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-rp-azul" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-rp-azul break-all">{relato.protocolo}</p>
                  <p className="text-sm font-semibold text-rp-texto mt-1">{info.label}</p>
                  <p className="text-xs text-rp-cinza-medio mt-0.5 leading-relaxed">{info.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-rp-cinza-borda text-xs text-rp-cinza-medio">
                <Clock size={12} />
                Registrado em {new Date(relato.criado_em).toLocaleDateString('pt-BR')} · retorno em até {relato.sla_dias} dias úteis
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rp-cinza-borda">
              <p className="text-xs font-semibold text-rp-texto mb-3 flex items-center gap-1.5">
                <MessageSquare size={13} />
                Conversa com o comitê
              </p>

              {relato.mensagens.length === 0 ? (
                <p className="text-xs text-rp-cinza-medio py-3 text-center">
                  Ainda não há mensagens. Você será avisado aqui quando o comitê responder.
                </p>
              ) : (
                <div className="space-y-3 mb-3">
                  {relato.mensagens.map((m, i) => (
                    <div key={i} className={`rounded-xl px-3 py-2.5 ${m.de_equipe ? 'bg-rp-azul-suave' : 'bg-rp-cinza-claro ml-6'}`}>
                      <p className={`text-[11px] font-semibold mb-1 ${m.de_equipe ? 'text-rp-azul' : 'text-rp-cinza-medio'}`}>
                        {m.autor}
                      </p>
                      <p className="text-sm text-rp-texto leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                      <p className="text-[10px] text-rp-cinza-medio mt-1.5">
                        {new Date(m.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {relato.pode_responder ? (
                <div className="pt-3 border-t border-rp-cinza-borda">
                  <textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Escreva uma mensagem ao comitê..."
                    rows={3}
                    className="w-full input-field resize-none text-sm"
                  />
                  <button
                    onClick={enviarResposta}
                    disabled={!resposta.trim() || enviando}
                    className="w-full mt-2 bg-rp-laranja text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-40 hover:bg-rp-laranja-claro transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    {enviando ? 'Enviando...' : 'Enviar mensagem'}
                  </button>
                  <p className="text-[11px] text-rp-cinza-medio mt-2 text-center">
                    Sua resposta continua anônima.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-rp-cinza-medio pt-3 border-t border-rp-cinza-borda">
                  Este relato foi encerrado e não aceita novas mensagens.
                </p>
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs text-rp-cinza-medio pb-6">
          Perdeu o protocolo? Por segurança não é possível recuperá-lo — nem nós conseguimos
          ligar um relato anônimo a você. Envie um novo relato se precisar.
        </p>
      </div>
    </div>
  )
}
