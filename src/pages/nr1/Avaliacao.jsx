import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { nr1PublicoService } from '../../services/nr1Service'
import {
  CHECKLIST_SECTIONS,
  TOTAL_ITENS,
  SEXO_OPTIONS,
  FAIXA_ETARIA_OPTIONS,
} from '../../constants/checklistSections'

const VALOR_LABELS = {
  S: 'Satisfatório',
  P: 'Parcialmente',
  N: 'Não satisfatório',
}

const VALOR_COLORS = {
  S: 'bg-green-500 border-green-500 text-white',
  P: 'bg-yellow-400 border-yellow-400 text-white',
  N: 'bg-red-500 border-red-500 text-white',
}

const VALOR_IDLE = 'bg-white border-rp-cinza-borda text-rp-cinza-medio hover:border-rp-azul hover:text-rp-azul'

function BotaoValor({ valor, selecionado, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border-2 text-xs font-bold tracking-wide transition-all ${
        selecionado ? VALOR_COLORS[valor] : VALOR_IDLE
      }`}
    >
      {valor} — {VALOR_LABELS[valor]}
    </button>
  )
}

function BarraProgresso({ respondidas }) {
  const pct = Math.round((respondidas / TOTAL_ITENS) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-rp-cinza-medio mb-1">
        <span>{respondidas} de {TOTAL_ITENS} itens respondidos</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-rp-cinza-claro rounded-full overflow-hidden">
        <div
          className="h-full bg-rp-azul rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Etapa 1: dados do respondente
function EtapaIdentificacao({ avaliacao, onSubmit }) {
  const [setorId, setSetorId] = useState('')
  const [sexo, setSexo] = useState('')
  const [faixaEtaria, setFaixaEtaria] = useState('')
  const [error, setError] = useState('')

  function handleNext() {
    if (!setorId) { setError('Selecione seu setor.'); return }
    if (!sexo) { setError('Selecione seu sexo.'); return }
    if (!faixaEtaria) { setError('Selecione sua faixa etária.'); return }
    setError('')
    onSubmit({ setor_id: Number(setorId), sexo, faixa_etaria: faixaEtaria })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-rp-azul text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            PGR · NR-1 · Portaria MTE 1.419/2024
          </div>
          <h1 className="text-xl font-bold text-rp-texto">{avaliacao.titulo}</h1>
          <p className="text-sm text-rp-cinza-medio mt-1">{avaliacao.empresa}</p>
        </div>

        <p className="text-sm text-rp-cinza-medio mb-6 text-center">
          Esta avaliação é <strong>anônima</strong>. Nenhum dado pessoal será coletado.
          Responda com sinceridade para que possamos melhorar o ambiente de trabalho.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">Setor / Área</label>
            <select
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
              className="w-full border border-rp-cinza-borda rounded-xl px-4 py-3 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul"
            >
              <option value="">Selecione seu setor</option>
              {avaliacao.setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">Sexo</label>
            <div className="grid grid-cols-3 gap-2">
              {SEXO_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setSexo(o.value)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    sexo === o.value
                      ? 'border-rp-azul bg-rp-azul-suave text-rp-azul'
                      : 'border-rp-cinza-borda text-rp-cinza-medio hover:border-rp-azul/50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">Faixa etária</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FAIXA_ETARIA_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFaixaEtaria(o.value)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    faixaEtaria === o.value
                      ? 'border-rp-azul bg-rp-azul-suave text-rp-azul'
                      : 'border-rp-cinza-borda text-rp-cinza-medio hover:border-rp-azul/50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            onClick={handleNext}
            className="w-full py-3 bg-rp-azul text-white rounded-xl font-semibold text-sm hover:bg-rp-azul/90 transition-colors flex items-center justify-center gap-2"
          >
            Iniciar avaliação <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Etapa 2: checklist por seção
function EtapaChecklist({ respostas, setRespostas, onEnviar, enviando }) {
  const [secaoAtual, setSecaoAtual] = useState(0)
  const secao = CHECKLIST_SECTIONS[secaoAtual]

  function responder(secaoIdx, itemIdx, valor) {
    const chave = `${secaoIdx}-${itemIdx}`
    setRespostas((prev) => ({ ...prev, [chave]: valor }))
  }

  function respondidas() {
    return Object.keys(respostas).length
  }

  function secaoCompleta(sIdx) {
    return CHECKLIST_SECTIONS[sIdx].items.every((_, iIdx) => respostas[`${sIdx}-${iIdx}`])
  }

  function todasCompletas() {
    return CHECKLIST_SECTIONS.every((_, sIdx) => secaoCompleta(sIdx))
  }

  const podeAvancar = secaoCompleta(secaoAtual)
  const ehUltimaSecao = secaoAtual === CHECKLIST_SECTIONS.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <BarraProgresso respondidas={respondidas()} />
      </div>

      {/* Navegação de seções */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {CHECKLIST_SECTIONS.map((s, idx) => {
          const completa = secaoCompleta(idx)
          return (
            <button
              key={s.id}
              onClick={() => setSecaoAtual(idx)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                idx === secaoAtual
                  ? 'bg-rp-azul text-white'
                  : completa
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white text-rp-cinza-medio border border-rp-cinza-borda hover:border-rp-azul/40'
              }`}
            >
              {completa && idx !== secaoAtual && <CheckCircle size={11} />}
              {s.id}. {s.title.split(' ')[0]}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-7 h-7 rounded-full bg-rp-azul text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {secao.id}
          </span>
          <div>
            <p className="text-base font-bold text-rp-texto">{secao.title}</p>
            <p className="text-xs text-rp-cinza-medio">{secao.items.length} itens</p>
          </div>
        </div>

        <div className="space-y-5">
          {secao.items.map((item, iIdx) => {
            const chave = `${secaoAtual}-${iIdx}`
            const valorAtual = respostas[chave]
            return (
              <div key={iIdx} className={`rounded-xl p-4 transition-colors ${valorAtual ? 'bg-rp-cinza-claro' : 'bg-rp-cinza-claro/50'}`}>
                <p className="text-sm text-rp-texto mb-3 font-medium leading-snug">{item}</p>
                <div className="flex gap-2 flex-wrap">
                  {['S', 'P', 'N'].map((v) => (
                    <BotaoValor
                      key={v}
                      valor={v}
                      selecionado={valorAtual === v}
                      onClick={() => responder(secaoAtual, iIdx, v)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-rp-cinza-borda">
          <button
            onClick={() => setSecaoAtual((p) => Math.max(0, p - 1))}
            disabled={secaoAtual === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rp-cinza-borda text-sm text-rp-cinza-medio hover:bg-rp-cinza-claro disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} /> Anterior
          </button>

          {ehUltimaSecao ? (
            <button
              onClick={onEnviar}
              disabled={!todasCompletas() || enviando}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar respostas'} <CheckCircle size={15} />
            </button>
          ) : (
            <button
              onClick={() => setSecaoAtual((p) => p + 1)}
              disabled={!podeAvancar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rp-azul text-white text-sm font-semibold hover:bg-rp-azul/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima seção <ChevronRight size={15} />
            </button>
          )}
        </div>

        {ehUltimaSecao && !todasCompletas() && (
          <p className="text-xs text-center text-rp-cinza-medio mt-3">
            Responda todos os itens de todas as seções antes de enviar.
          </p>
        )}
      </div>
    </div>
  )
}

// Etapa 3: confirmação
function EtapaConfirmacao({ empresa }) {
  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-card p-10">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-rp-texto mb-2">Obrigado pela participação!</h2>
        <p className="text-sm text-rp-cinza-medio mb-6">
          Suas respostas foram registradas com sucesso de forma anônima.
          Elas contribuirão para melhorar o ambiente de trabalho em <strong>{empresa}</strong>.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 text-xs text-rp-azul text-left space-y-1.5">
          <p className="font-semibold">Sobre esta avaliação:</p>
          <p>· Nenhum dado pessoal foi coletado ou armazenado.</p>
          <p>· Os resultados são analisados de forma agregada e anônima.</p>
          <p>· A empresa receberá um relatório consolidado para o PGR/NR-1.</p>
        </div>
      </div>
    </div>
  )
}

// Página principal
export default function AvaliacaoNr1() {
  const { codigo } = useParams()
  const [etapa, setEtapa] = useState('carregando') // carregando | erro | identificacao | checklist | confirmacao
  const [avaliacao, setAvaliacao] = useState(null)
  const [dadosRespondente, setDadosRespondente] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    nr1PublicoService.buscarPorCodigo(codigo)
      .then((res) => {
        if (res.success) {
          setAvaliacao(res.data)
          setEtapa('identificacao')
        } else {
          setEtapa('erro')
        }
      })
      .catch(() => setEtapa('erro'))
  }, [codigo])

  function handleIdentificacao(dados) {
    setDadosRespondente(dados)
    setEtapa('checklist')
  }

  async function handleEnviar() {
    setEnviando(true)
    setErrorMsg('')
    try {
      const payload = Object.entries(respostas).map(([chave, valor]) => {
        const [secaoIdx, itemIdx] = chave.split('-').map(Number)
        return {
          secao: secaoIdx + 1,
          item: itemIdx + 1,
          valor,
        }
      })

      await nr1PublicoService.responder(codigo, {
        ...dadosRespondente,
        respostas: payload,
      })
      setEtapa('confirmacao')
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-rp-cinza-claro py-8 px-4">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-center gap-2">
        <span className="text-lg font-bold text-rp-azul">Radar<span className="text-rp-laranja">Pessoas</span></span>
        <span className="text-xs text-rp-cinza-medio">· Sara Linhar Consultoria</span>
      </div>

      {etapa === 'carregando' && (
        <div className="text-center py-20 text-sm text-rp-cinza-medio">Carregando avaliação...</div>
      )}

      {etapa === 'erro' && (
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-card p-10">
            <p className="text-rp-texto font-bold text-lg mb-2">Avaliação não encontrada</p>
            <p className="text-sm text-rp-cinza-medio">
              O link pode estar incorreto ou a avaliação foi encerrada.<br />
              Entre em contato com o responsável da sua empresa.
            </p>
          </div>
        </div>
      )}

      {etapa === 'identificacao' && avaliacao && (
        <EtapaIdentificacao avaliacao={avaliacao} onSubmit={handleIdentificacao} />
      )}

      {etapa === 'checklist' && (
        <>
          <EtapaChecklist
            respostas={respostas}
            setRespostas={setRespostas}
            onEnviar={handleEnviar}
            enviando={enviando}
          />
          {errorMsg && (
            <p className="text-center text-sm text-red-600 mt-4">{errorMsg}</p>
          )}
        </>
      )}

      {etapa === 'confirmacao' && (
        <EtapaConfirmacao empresa={avaliacao?.empresa} />
      )}

      <p className="text-center text-xs text-rp-cinza-medio mt-8">
        Avaliação anônima · Conformidade LGPD · NR-1 / PGR
      </p>
    </div>
  )
}
