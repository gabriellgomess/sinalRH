import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Shield, Lock, Send, Clock, AlertTriangle } from 'lucide-react'
import { escutaComiteService } from '../../services/escutaPublicoService'

const statusConfig = {
  pendente:   { label: 'Pendente',   bg: 'bg-yellow-100 text-yellow-700' },
  em_analise: { label: 'Em análise', bg: 'bg-blue-100 text-blue-700' },
  resolvido:  { label: 'Resolvido',  bg: 'bg-green-100 text-green-700' },
  arquivado:  { label: 'Arquivado',  bg: 'bg-gray-100 text-gray-500' },
}

const prioridadeConfig = {
  baixa:  { label: 'Baixa',   bg: 'bg-gray-100 text-gray-600' },
  media:  { label: 'Média',   bg: 'bg-blue-100 text-blue-700' },
  alta:   { label: 'Alta',    bg: 'bg-orange-100 text-orange-700' },
  critica:{ label: 'Crítica', bg: 'bg-red-100 text-red-700' },
}

/**
 * Tratamento de relato pelo comitê/conselho externo.
 * Sem login: a credencial é o token do link recebido por e-mail.
 */
export default function EscutaComite() {
  const { token } = useParams()
  const [relato, setRelato] = useState(null)
  const [invalido, setInvalido] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    escutaComiteService.buscar(token).then(setRelato).catch(() => setInvalido(true))
  }, [token])

  async function enviar() {
    if (!mensagem.trim()) return
    setEnviando(true)
    setErro('')
    try {
      const res = await escutaComiteService.responder(token, mensagem)
      setRelato((r) => ({ ...r, status: res.status, mensagens: [...r.mensagens, res.mensagem] }))
      setMensagem('')
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível enviar a resposta.')
    } finally {
      setEnviando(false)
    }
  }

  async function mudarStatus(status) {
    try {
      const res = await escutaComiteService.atualizarStatus(token, status)
      setRelato((r) => ({ ...r, status: res.status }))
    } catch (err) {
      setErro('Não foi possível atualizar o status.')
    }
  }

  if (invalido) {
    return (
      <div className="min-h-screen bg-rp-cinza-claro flex flex-col items-center justify-center px-6 text-center">
        <Lock size={40} className="text-rp-cinza-medio mb-4" />
        <h1 className="text-lg font-bold text-rp-azul mb-2">Acesso não encontrado</h1>
        <p className="text-sm text-rp-cinza-medio max-w-sm">
          Este link não é válido. Utilize o link exato recebido por e-mail.
        </p>
      </div>
    )
  }

  if (!relato) {
    return (
      <div className="min-h-screen bg-rp-cinza-claro flex items-center justify-center">
        <p className="text-sm text-rp-cinza-medio">Carregando...</p>
      </div>
    )
  }

  const sc = statusConfig[relato.status] || statusConfig.pendente
  const pc = prioridadeConfig[relato.prioridade] || prioridadeConfig.media

  return (
    <div className="min-h-screen bg-rp-cinza-claro flex flex-col">
      <div className="bg-white px-5 pt-6 pb-4 border-b border-rp-cinza-borda">
        <h1 className="text-xl font-bold text-rp-azul">Tratamento externo</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">
          Canal de Escuta · {relato.empresa} · Confidencial
        </p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-2xl w-full mx-auto">
        <div className="flex items-start gap-2 bg-rp-azul-suave rounded-xl px-4 py-3">
          <Shield size={14} className="text-rp-azul flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rp-azul leading-relaxed">
            Este relato envolve o nível mais alto da organização e, por isso,
            <strong> não é visível a nenhum usuário interno do sistema</strong>. O link é a sua
            credencial de acesso — não o repasse.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rp-cinza-borda">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-rp-cinza-medio">{relato.protocolo}</p>
              <p className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest mt-1">
                {relato.categoria?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg}`}>{sc.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.bg}`}>{pc.label}</span>
            </div>
          </div>

          <p className="text-sm text-rp-texto leading-relaxed whitespace-pre-wrap">{relato.texto}</p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-rp-cinza-borda text-xs text-rp-cinza-medio">
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(relato.criado_em).toLocaleString('pt-BR')}</span>
            {relato.setor && <span>Setor: {relato.setor}</span>}
            {relato.origem === 'publico' && <span>Origem: página pública (anônimo)</span>}
            {relato.cargo_nivel_denunciado && <span>Alvo informado: {relato.cargo_nivel_denunciado}</span>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rp-cinza-borda">
          <p className="text-xs font-semibold text-rp-azul mb-1">Conversa com quem relatou</p>
          <p className="text-[11px] text-rp-cinza-medio mb-3 leading-relaxed">
            Suas mensagens aparecem para quem relatou ao consultar o protocolo. O anonimato é
            preservado nos dois sentidos.
          </p>

          {relato.mensagens.length === 0 ? (
            <p className="text-xs text-rp-cinza-medio italic py-2">Nenhuma mensagem trocada ainda.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {relato.mensagens.map((m) => (
                <div key={m.id} className={`rounded-lg px-3 py-2 ${m.de_equipe ? 'bg-rp-azul-suave' : 'bg-rp-cinza-claro ml-6'}`}>
                  <p className={`text-[10px] font-semibold mb-1 ${m.de_equipe ? 'text-rp-azul' : 'text-rp-cinza-medio'}`}>{m.autor}</p>
                  <p className="text-sm text-rp-texto whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                  <p className="text-[10px] text-rp-cinza-medio mt-1">{new Date(m.data).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={3}
            placeholder="Escrever resposta a quem relatou..."
            className="w-full input-field resize-none text-sm"
          />
          {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}
          <button
            onClick={enviar}
            disabled={!mensagem.trim() || enviando}
            className="w-full mt-2 bg-rp-laranja text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-40 hover:bg-rp-laranja-claro transition-all flex items-center justify-center gap-2"
          >
            <Send size={15} />
            {enviando ? 'Enviando...' : 'Enviar resposta'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rp-cinza-borda">
          <p className="text-xs font-semibold text-rp-azul mb-3">Situação do caso</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => mudarStatus('em_analise')}
              className="flex-1 py-2.5 rounded-lg bg-rp-azul text-white text-sm font-semibold hover:bg-rp-azul-deep transition-colors">
              Em análise
            </button>
            <button onClick={() => mudarStatus('resolvido')}
              className="flex-1 py-2.5 rounded-lg border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors">
              Resolver
            </button>
            <button onClick={() => mudarStatus('arquivado')}
              className="flex-1 py-2.5 rounded-lg border border-rp-cinza-borda text-rp-cinza-medio text-sm font-medium hover:bg-rp-cinza-claro transition-colors">
              Arquivar
            </button>
          </div>
          <p className="text-[11px] text-rp-cinza-medio mt-3 flex items-start gap-1.5">
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
            Arquivar encerra o caso: quem relatou deixa de poder enviar novas mensagens.
          </p>
        </div>
      </div>
    </div>
  )
}
