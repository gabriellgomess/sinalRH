import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import { pesquisaAppService } from '../../services/appService'

const escalaLikert = [
  { valor: 5, label: 'Concordo totalmente' },
  { valor: 4, label: 'Concordo parcialmente' },
  { valor: 3, label: 'Neutro' },
  { valor: 2, label: 'Discordo parcialmente' },
  { valor: 1, label: 'Discordo totalmente' }
]

export default function PesquisaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pesquisa, setPesquisa] = useState(null)
  const [perguntas, setPerguntas] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [enviada, setEnviada] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    pesquisaAppService.buscar(id)
      .then((data) => {
        setPesquisa(data.pesquisa)
        setPerguntas(data.perguntas)
      })
      .catch(() => navigate('/app/pesquisas'))
      .finally(() => setLoadingData(false))
  }, [id, navigate])

  if (loadingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-rp-cinza-medio">Carregando pesquisa...</p>
      </div>
    )
  }

  if (!pesquisa) return null

  const currentPergunta = perguntas[currentIdx]
  const pct = Math.round((currentIdx / perguntas.length) * 100)
  const isLast = currentIdx === perguntas.length - 1
  const respostaAtual = respostas[currentPergunta?.id]

  function handleAnswer(valor) {
    setRespostas((prev) => ({ ...prev, [currentPergunta.id]: valor }))
  }

  function handleNext() {
    if (isLast) handleSubmit()
    else setCurrentIdx((i) => i + 1)
  }

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const payload = Object.entries(respostas).map(([pergunta_id, valor_numerico]) => ({
        pergunta_id: Number(pergunta_id),
        valor_numerico
      }))
      await pesquisaAppService.responder(id, payload)
      setEnviada(true)
      setTimeout(() => navigate('/app/pesquisas'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar pesquisa. Tente novamente.')
      setLoading(false)
    }
  }

  if (enviada) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl mb-4">🎉</span>
        <h2 className="text-xl font-bold text-rp-azul mb-2">Pesquisa concluída!</h2>
        <p className="text-sm text-rp-cinza-medio">Suas respostas foram enviadas com sigilo.</p>
        <p className="text-xs text-rp-cinza-medio mt-1">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-5 border-b border-rp-cinza-borda pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => currentIdx > 0 ? handlePrev() : navigate('/app/pesquisas')} className="p-2 -ml-2 text-rp-cinza-medio">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-rp-azul line-clamp-1">{pesquisa.titulo}</h1>
            <p className="text-xs text-rp-cinza-medio">
              {pesquisa.prazo ? `até ${new Date(pesquisa.prazo).toLocaleDateString('pt-BR')}` : 'Sem prazo'}
            </p>
          </div>
          <span className="text-xs text-rp-cinza-medio font-medium">{pct}%</span>
        </div>
        <div className="w-full bg-rp-cinza-borda rounded-full h-1.5">
          <div
            className="h-full bg-rp-azul rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        <p className="text-[11px] font-bold text-rp-cinza-medio uppercase tracking-widest mb-1">
          Pergunta {currentIdx + 1} de {perguntas.length}
        </p>
        {currentPergunta?.dimensao && (
          <p className="text-[11px] font-bold text-rp-laranja uppercase tracking-widest mb-3">
            Dimensão · {currentPergunta.dimensao.replace(/_/g, ' ')}
          </p>
        )}
        <h2 className="text-lg font-bold text-rp-texto mb-6 leading-snug">
          {currentPergunta?.texto}
        </h2>

        <div className="space-y-2.5 mb-8">
          {escalaLikert.map((op) => (
            <button
              key={op.valor}
              onClick={() => handleAnswer(op.valor)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                respostaAtual === op.valor
                  ? 'border-rp-azul bg-rp-azul-suave'
                  : 'border-rp-cinza-borda bg-white hover:border-rp-azul/30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                respostaAtual === op.valor ? 'border-rp-azul bg-rp-azul' : 'border-rp-cinza-borda'
              }`}>
                {respostaAtual === op.valor && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-sm font-medium ${respostaAtual === op.valor ? 'text-rp-azul' : 'text-rp-texto'}`}>
                {op.label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <button
          onClick={handleNext}
          disabled={!respostaAtual || loading}
          className="w-full bg-rp-laranja text-white font-semibold rounded-xl py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rp-laranja-claro active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Enviando...' : isLast ? 'Enviar pesquisa' : 'Próxima pergunta'}
          {!loading && !isLast && <ArrowRight size={16} />}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-rp-cinza-medio">
          <Lock size={11} />
          <span>Confidencial · Sara Linhar Consultoria</span>
        </div>
      </div>
    </div>
  )
}
