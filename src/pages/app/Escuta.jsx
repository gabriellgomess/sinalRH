import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, User, Lock, Send } from 'lucide-react'
import { escutaService } from '../../services/appService'

const categorias = [
  'clima_equipe',
  'carga_trabalho',
  'lideranca',
  'assedio_discriminacao',
  'condicoes_ambiente',
  'reconhecimento_carreira',
  'comunicacao_interna',
  'sugestao_melhoria',
  'outro'
]

const categoriaLabels = {
  clima_equipe: 'Clima da equipe',
  carga_trabalho: 'Sobrecarga de trabalho',
  lideranca: 'Relacionamento com a liderança',
  assedio_discriminacao: 'Assédio ou discriminação',
  condicoes_ambiente: 'Condições do ambiente',
  reconhecimento_carreira: 'Reconhecimento e carreira',
  comunicacao_interna: 'Comunicação interna',
  sugestao_melhoria: 'Sugestão de melhoria',
  outro: 'Outro'
}

const tags = ['assedio', 'sobrecarga', 'sugestão', 'clima', 'outro']

export default function Escuta() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('anonimo')
  const [categoria, setCategoria] = useState('')
  const [tagSelecionada, setTagSelecionada] = useState('')
  const [relato, setRelato] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!relato.trim() || !categoria) return
    setLoading(true)
    setError('')
    try {
      await escutaService.enviar(modo, categoria, tagSelecionada || null, relato)
      setEnviado(true)
      setTimeout(() => navigate('/app'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar relato. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Shield size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-rp-azul mb-2">Relato enviado com segurança</h2>
        <p className="text-sm text-rp-cinza-medio">Sua mensagem chegou ao time de cuidado e será tratada com sigilo.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rp-cinza-claro flex flex-col">
      <div className="bg-white px-5 pt-6 pb-4 border-b border-rp-cinza-borda">
        <h1 className="text-xl font-bold text-rp-azul">Canal de escuta</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">Espaço seguro · Confidencial</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        <p className="text-sm text-rp-cinza-medio leading-relaxed">
          Use este espaço para relatar uma situação, dar uma sugestão ou pedir ajuda.
        </p>

        <div>
          <p className="text-xs font-semibold text-rp-texto mb-2">Como deseja se identificar?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'anonimo', icon: Shield, label: 'Anônimo', desc: 'Sem dados de identificação' },
              { value: 'identificado', icon: User, label: 'Identificado', desc: 'Com seu nome e setor' }
            ].map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                onClick={() => setModo(value)}
                className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                  modo === value ? 'border-rp-azul bg-rp-azul-suave' : 'border-rp-cinza-borda bg-white'
                }`}
              >
                <Icon size={20} className={modo === value ? 'text-rp-azul' : 'text-rp-cinza-medio'} />
                <span className={`text-sm font-semibold ${modo === value ? 'text-rp-azul' : 'text-rp-texto'}`}>{label}</span>
                <span className="text-[10px] text-rp-cinza-medio text-center leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">Categoria do relato</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="input-field"
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map((c) => <option key={c} value={c}>{categoriaLabels[c]}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTagSelecionada(tagSelecionada === t ? '' : t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                tagSelecionada === t
                  ? 'bg-rp-azul text-white border-rp-azul'
                  : 'bg-white text-rp-cinza-medio border-rp-cinza-borda hover:border-rp-azul'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">Conte com suas palavras</label>
          <textarea
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            placeholder="Descreva o que aconteceu, há quanto tempo, e quem está envolvido..."
            rows={5}
            className="w-full input-field resize-none"
          />
        </div>

        <div className="bg-rp-azul-suave rounded-xl px-4 py-3 flex items-start gap-2">
          <Lock size={14} className="text-rp-azul flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rp-azul leading-relaxed">
            Canal protegido. Mensagens são analisadas por equipe especializada da Sara Linhar Consultoria.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!relato.trim() || !categoria || loading}
          className="w-full bg-rp-laranja text-white font-semibold rounded-xl py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rp-laranja-claro active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {loading ? 'Enviando...' : 'Enviar relato'}
        </button>
      </div>
    </div>
  )
}
