import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { pesquisaAdminService, setorService } from '../../services/adminService'

const tiposPergunta = ['Likert (1–5)', 'Múltipla escolha', 'Sim / Não', 'Escala NPS (0–10)', 'Texto livre']

const tipoMap = {
  'Likert (1–5)':      'likert',
  'Múltipla escolha':  'multipla_escolha',
  'Sim / Não':         'sim_nao',
  'Escala NPS (0–10)': 'nps',
  'Texto livre':       'texto_livre',
}

const tiposPesquisa = ['Clima', 'Pulse', 'NPS', 'Risco', '360°', 'Cultura']

const tipoApiMap = {
  'Clima': 'clima', 'Pulse': 'pulse', 'NPS': 'nps',
  'Risco': 'risco', '360°':  '360',  'Cultura': 'cultura',
}

export default function NovaPesquisa() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('Clima')
  const [prazo, setPrazo] = useState('')
  const [setorId, setSetorId] = useState('')
  const [setores, setSetores] = useState([])
  const [perguntas, setPerguntas] = useState([
    { id: 1, texto: '', tipo: 'Likert (1–5)', dimensao: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [loadingRascunho, setLoadingRascunho] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setorService.listar()
      .then((data) => setSetores(data.data ?? []))
      .catch(console.error)
  }, [])

  function addPergunta() {
    setPerguntas((prev) => [...prev, { id: Date.now(), texto: '', tipo: 'Likert (1–5)', dimensao: '' }])
  }

  function removePergunta(id) {
    if (perguntas.length <= 1) return
    setPerguntas((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePergunta(id, field, value) {
    setPerguntas((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p))
  }

  function buildPayload() {
    return {
      titulo,
      descricao: descricao || null,
      tipo:      tipoApiMap[tipo] ?? tipo.toLowerCase(),
      prazo:     prazo || null,
      setor_id:  setorId ? Number(setorId) : null,
      perguntas: perguntas
        .filter((p) => p.texto.trim())
        .map((p) => ({
          texto:    p.texto.trim(),
          tipo:     tipoMap[p.tipo] ?? 'likert',
          dimensao: p.dimensao.trim() || null,
        })),
    }
  }

  async function handleRascunho() {
    if (!titulo.trim()) { setError('Informe o título da pesquisa.'); return }
    if (perguntas.every((p) => !p.texto.trim())) { setError('Adicione pelo menos uma pergunta.'); return }
    setError('')
    setLoadingRascunho(true)
    try {
      await pesquisaAdminService.criar(buildPayload())
      navigate('/admin/pesquisas')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao salvar rascunho.'
      setError(msg)
    } finally {
      setLoadingRascunho(false)
    }
  }

  async function handlePublish() {
    if (!titulo.trim()) { setError('Informe o título da pesquisa.'); return }
    if (perguntas.some((p) => !p.texto.trim())) { setError('Preencha o texto de todas as perguntas.'); return }
    setError('')
    setLoading(true)
    try {
      const criada = await pesquisaAdminService.criar(buildPayload())
      await pesquisaAdminService.publicar(criada.id)
      navigate('/admin/pesquisas')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao publicar pesquisa.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/pesquisas')} className="p-2 rounded-lg hover:bg-white border border-rp-cinza-borda text-rp-cinza-medio transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-rp-azul">Nova pesquisa</h1>
          <p className="text-sm text-rp-cinza-medio">Configure e publique uma nova escuta</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-rp-azul mb-4">Informações gerais</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Título da pesquisa *</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Pesquisa de clima · 3º trimestre" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Descrição</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Explique brevemente o objetivo desta pesquisa..." className="input-field resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field">
                  {tiposPesquisa.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Prazo de encerramento</label>
                <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Público-alvo</label>
              <select value={setorId} onChange={(e) => setSetorId(e.target.value)} className="input-field">
                <option value="">Todos os empregados</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}{s.unidade ? ` (${s.unidade})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-rp-azul">Perguntas ({perguntas.length})</h3>
          </div>
          <div className="space-y-3">
            {perguntas.map((p, idx) => (
              <div key={p.id} className="border border-rp-cinza-borda rounded-xl p-4 group">
                <div className="flex items-start gap-3">
                  <GripVertical size={16} className="text-rp-cinza-borda mt-2.5 cursor-grab flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rp-cinza-medio w-5">{idx + 1}.</span>
                      <input
                        value={p.texto}
                        onChange={(e) => updatePergunta(p.id, 'texto', e.target.value)}
                        placeholder="Digite a pergunta..."
                        className="flex-1 text-sm border-0 border-b border-rp-cinza-borda focus:outline-none focus:border-rp-azul py-1 text-rp-texto placeholder-rp-cinza-medio transition-colors"
                      />
                    </div>
                    <div className="flex gap-2 ml-7">
                      <select
                        value={p.tipo}
                        onChange={(e) => updatePergunta(p.id, 'tipo', e.target.value)}
                        className="text-xs border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-cinza-medio focus:outline-none focus:ring-1 focus:ring-rp-azul"
                      >
                        {tiposPergunta.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <input
                        value={p.dimensao}
                        onChange={(e) => updatePergunta(p.id, 'dimensao', e.target.value)}
                        placeholder="Dimensão (opcional)"
                        className="flex-1 text-xs border border-rp-cinza-borda rounded-lg px-2.5 py-1.5 text-rp-cinza-medio focus:outline-none focus:ring-1 focus:ring-rp-azul"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removePergunta(p.id)}
                    disabled={perguntas.length <= 1}
                    className="p-1.5 rounded-lg text-rp-cinza-borda hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addPergunta}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-rp-azul hover:text-rp-laranja transition-colors"
          >
            <Plus size={15} /> Adicionar pergunta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex justify-between gap-3 pb-4">
          <Button variant="outline" onClick={() => navigate('/admin/pesquisas')}>Cancelar</Button>
          <div className="flex gap-2">
            <Button variant="secondary" loading={loadingRascunho} onClick={handleRascunho}>
              Salvar rascunho
            </Button>
            <Button variant="primary" loading={loading} onClick={handlePublish}>
              Publicar pesquisa
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
