import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { checkinService } from '../../services/appService'

const opcoes = [
  { emoji: '😊', label: 'Muito bem', desc: 'Energia alta, motivada', value: 5 },
  { emoji: '🙂', label: 'Bem', desc: 'Tranquila, na média', value: 4 },
  { emoji: '😐', label: 'Neutra', desc: 'Sem grandes mudanças', value: 3 },
  { emoji: '😕', label: 'Pouco bem', desc: 'Pressionada ou cansada', value: 2 },
  { emoji: '😔', label: 'Nada bem', desc: 'Preciso de apoio', value: 1 }
]

export default function CheckIn() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkinService.getAtual().then((data) => {
      if (data.feito) navigate('/app')
    }).catch(() => {})
  }, [navigate])

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await checkinService.enviar(selected, comentario)
      setEnviado(true)
      setTimeout(() => navigate('/app'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar check-in. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl mb-4">✅</span>
        <h2 className="text-xl font-bold text-rp-azul mb-2">Obrigada por compartilhar!</h2>
        <p className="text-sm text-rp-cinza-medio">Sua resposta foi registrada com sigilo.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-rp-cinza-borda">
        <button onClick={() => navigate('/app')} className="p-2 -ml-2 text-rp-cinza-medio hover:text-rp-texto">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-rp-azul">Check-in semanal</h1>
          <p className="text-xs text-rp-cinza-medio">Como você está se sentindo?</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        <p className="text-[11px] font-bold text-rp-laranja uppercase tracking-widest mb-2">Humor desta semana</p>
        <h2 className="text-lg font-bold text-rp-texto mb-6">
          Como você está se sentindo no trabalho esta semana?
        </h2>

        <div className="space-y-3 mb-6">
          {opcoes.map((op) => (
            <button
              key={op.value}
              onClick={() => setSelected(op.value)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                selected === op.value
                  ? 'border-rp-laranja bg-orange-50'
                  : 'border-rp-cinza-borda bg-white hover:border-rp-azul/30'
              }`}
            >
              <span className="text-2xl">{op.emoji}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-rp-texto">{op.label}</p>
                <p className="text-xs text-rp-cinza-medio">{op.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected === op.value ? 'border-rp-laranja bg-rp-laranja' : 'border-rp-cinza-borda'
              }`}>
                {selected === op.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-rp-texto mb-2">
            Quer comentar algo? <span className="text-rp-cinza-medio font-normal">(opcional)</span>
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Compartilhe o que está pensando ou ajudando esta semana..."
            rows={3}
            className="w-full input-field resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          className="w-full bg-rp-laranja text-white font-semibold rounded-xl py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rp-laranja-claro active:scale-95 transition-all"
        >
          {loading ? 'Enviando...' : 'Enviar resposta'}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-rp-cinza-medio">
          <Lock size={11} />
          <span>Suas respostas são tratadas com confidencialidade.</span>
        </div>
      </div>
    </div>
  )
}
