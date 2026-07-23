import { useState, useEffect } from 'react'
import { Plus, Trash2, X, BookmarkCheck, ClipboardList, RefreshCw } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { RiskRadarChart } from '../../components/charts/RadarChart'
import { riscoService } from '../../services/adminService'
import { getRiskBarColor } from '../../utils/formatters'
import { Button } from '../../components/ui/Button'

const DIMENSAO_LABELS = {
  demanda_trabalho:       'Demanda de trabalho',
  autonomia:              'Autonomia',
  suporte_social:         'Suporte social',
  reconhecimento:         'Reconhecimento',
  seguranca_emprego:      'Segurança',
  justica_organizacional: 'Justiça org.',
  assedio_moral:          'Assédio moral',
  comunicacao:            'Comunicação',
  demanda:                'Demanda de trabalho',
  lideranca:              'Qualidade da liderança',
  clareza:                'Clareza de papel',
  conflitos:              'Conflitos interpessoais',
  apoio_social:           'Apoio social',
}

function mapDimensoes(d) {
  return Object.fromEntries(
    Object.entries(d ?? {}).map(([k, v]) => [DIMENSAO_LABELS[k] || k, v])
  )
}

const ACAO_VAZIA = { descricao: '', prazo: '', responsavel: '' }

function PlanoAcaoModal({ setorId, onClose, onSaved }) {
  const [acoes, setAcoes] = useState([{ ...ACAO_VAZIA }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addAcao() {
    setAcoes((prev) => [...prev, { ...ACAO_VAZIA }])
  }

  function removeAcao(i) {
    if (acoes.length <= 1) return
    setAcoes((prev) => prev.filter((_, idx) => idx !== i))
  }

  function setAcao(i, field, value) {
    setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  async function handleSalvar() {
    const incompletas = acoes.filter((a) => !a.descricao.trim() || !a.prazo || !a.responsavel.trim())
    if (incompletas.length > 0) { setError('Preencha todos os campos de cada ação.'); return }
    setSaving(true)
    setError('')
    try {
      await riscoService.salvarPlanoAcao(setorId, acoes)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar plano de ação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <div>
            <h2 className="text-base font-bold text-rp-azul">Plano de ação</h2>
            <p className="text-xs text-rp-cinza-medio mt-0.5">Defina as ações para mitigar os riscos identificados</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {acoes.map((acao, i) => (
            <div key={i} className="border border-rp-cinza-borda rounded-xl p-4 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Ação {i + 1}</span>
                <button
                  onClick={() => removeAcao(i)}
                  disabled={acoes.length <= 1}
                  className="p-1 text-rp-cinza-borda hover:text-red-400 transition-colors disabled:opacity-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-rp-texto mb-1">Descrição *</label>
                  <input
                    value={acao.descricao}
                    onChange={(e) => setAcao(i, 'descricao', e.target.value)}
                    placeholder="Ex: Implantar programa de apoio psicológico"
                    className="input-field text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-rp-texto mb-1">Prazo *</label>
                    <input
                      type="date"
                      value={acao.prazo}
                      onChange={(e) => setAcao(i, 'prazo', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-rp-texto mb-1">Responsável *</label>
                    <input
                      value={acao.responsavel}
                      onChange={(e) => setAcao(i, 'responsavel', e.target.value)}
                      placeholder="Ex: Gestora de RH"
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addAcao}
            className="flex items-center gap-2 text-sm font-semibold text-rp-azul hover:text-rp-laranja transition-colors"
          >
            <Plus size={14} /> Adicionar ação
          </button>

          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-2 pt-1">
            <Button variant="primary" loading={saving} onClick={handleSalvar}>
              <ClipboardList size={14} /> Salvar plano
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Riscos() {
  const [riscos, setRiscos] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [marcandoRevisao, setMarcandoRevisao] = useState(false)
  const [fonte, setFonte] = useState('clima')
  const [opcoesFonte, setOpcoesFonte] = useState({ clima: true, nr1: false })
  const [recarregarKey, setRecarregarKey] = useState(0)
  const [recalculando, setRecalculando] = useState(false)

  useEffect(() => {
    setLoading(true)
    riscoService.listar({ fonte })
      .then((data) => {
        const lista = data.riscos ?? []
        setRiscos(lista)
        setSelecionado(lista[0] ?? null)
        if (data.opcoes_fonte) {
          setOpcoesFonte(data.opcoes_fonte)
        }
        if (data.fonte && data.fonte !== fonte) {
          setFonte(data.fonte)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [fonte, recarregarKey])

  async function handleRecalcular() {
    setRecalculando(true)
    try {
      const res = await riscoService.recalcular()
      alert(res.message || 'Mapa atualizado.')
      setRecarregarKey((k) => k + 1)
    } catch (e) {
      alert(e.response?.data?.message || 'Erro ao recalcular.')
    } finally {
      setRecalculando(false)
    }
  }

  async function handleRevisao() {
    if (!selecionado) return
    setMarcandoRevisao(true)
    try {
      const res = await riscoService.marcarRevisao(selecionado.setor_id)
      setSelecionado((prev) => ({
        ...prev,
        para_revisao: res.para_revisao,
      }))
      setRiscos((prev) =>
        prev.map((r) => r.id === selecionado.id ? { ...r, para_revisao: res.para_revisao } : r)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setMarcandoRevisao(false)
    }
  }

  const niveis = ['todos', 'critico', 'alto', 'moderado', 'baixo']
  const setoresUnicos = [...new Set(riscos.map((r) => r.setor))].sort()
  const filtrados = riscos
    .filter((r) => filtroNivel === 'todos' || r.nivel === filtroNivel)
    .filter((r) => filtroSetor === '' || r.setor === filtroSetor)
  const emAtencao = riscos.filter((r) => ['critico', 'alto'].includes(r.nivel)).length

  const recomendacao = selecionado?.recomendacao
  const recomendacaoTitulo = typeof recomendacao === 'object'
    ? recomendacao?.titulo
    : recomendacao

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-rp-cinza-medio">Carregando riscos...</p>
      </div>
    )
  }

  const subtitle = fonte === 'nr1'
    ? 'Diretrizes de SSO (NR-1) · dados da última pesquisa'
    : 'Fatores Psicossociais (ISO 45003) · dados de clima corporativo'

  const toggleSource = opcoesFonte.clima && opcoesFonte.nr1 ? (
    <div className="flex bg-rp-cinza-claro p-1 rounded-xl border border-rp-cinza-borda animate-fade-in">
      <button
        onClick={() => setFonte('clima')}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          fonte === 'clima'
            ? 'bg-white text-rp-azul shadow-sm'
            : 'text-rp-cinza-medio hover:text-rp-texto'
        }`}
      >
        Dados do Clima (ISO 45003)
      </button>
      <button
        onClick={() => setFonte('nr1')}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          fonte === 'nr1'
            ? 'bg-white text-rp-azul shadow-sm'
            : 'text-rp-cinza-medio hover:text-rp-texto'
        }`}
      >
        Pesquisa NR-1 / PGR
      </button>
    </div>
  ) : null

  return (
    <div>
      <PageTitle
        title="Mapa de riscos psicossociais"
        subtitle={subtitle}
        action={toggleSource}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <select
            value={filtroSetor}
            onChange={(e) => { setFiltroSetor(e.target.value); setSelecionado(null) }}
            className={`appearance-none pl-3 pr-7 py-1.5 border rounded-lg text-sm font-medium cursor-pointer transition-colors focus:outline-none ${
              filtroSetor !== ''
                ? 'border-rp-azul bg-rp-azul-suave text-rp-azul'
                : 'border-rp-cinza-borda bg-white text-rp-texto hover:bg-rp-cinza-claro'
            }`}
          >
            <option value="">Todos os setores</option>
            {setoresUnicos.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rp-cinza-medio text-xs">▾</span>
        </div>
        {filtroSetor !== '' && (
          <button
            onClick={() => { setFiltroSetor(''); setSelecionado(riscos[0] ?? null) }}
            className="flex items-center gap-1 text-xs text-rp-cinza-medio hover:text-rp-texto transition-colors"
          >
            <X size={12} /> Limpar
          </button>
        )}
        {fonte === 'clima' && (
          <button
            onClick={handleRecalcular}
            disabled={recalculando}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-rp-azul border border-rp-azul/30 bg-rp-azul-suave px-3 py-1.5 rounded-lg hover:bg-rp-azul/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={recalculando ? 'animate-spin' : ''} /> {recalculando ? 'Recalculando...' : 'Recalcular do clima'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-rp-azul">Setores monitorados</h3>
              <p className="text-xs text-rp-cinza-medio">{riscos.length} setores · ordenado por nível de risco</p>
            </div>
            <span className="text-xs font-bold text-rp-laranja bg-orange-50 px-2.5 py-1 rounded-full">
              {emAtencao} EM ATENÇÃO
            </span>
          </div>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            {niveis.map((n) => (
              <button
                key={n}
                onClick={() => setFiltroNivel(n)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                  filtroNivel === n
                    ? 'bg-rp-azul text-white border-rp-azul'
                    : 'bg-white text-rp-cinza-medio border-rp-cinza-borda hover:border-rp-azul'
                }`}
              >
                {n === 'todos' ? 'Todos' : n}
              </button>
            ))}
          </div>

          {filtrados.length === 0 ? (
            <p className="text-sm text-rp-cinza-medio text-center py-8">Nenhum risco registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map((risco) => {
                const barColor = getRiskBarColor(risco.nivel)
                const isSelected = selecionado?.id === risco.id
                return (
                  <button
                    key={risco.id}
                    onClick={() => setSelecionado(risco)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      isSelected ? 'border-rp-azul bg-rp-azul-suave' : 'border-rp-cinza-borda bg-white hover:border-rp-azul/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-rp-texto">{risco.setor}</p>
                        {risco.para_revisao && (
                          <BookmarkCheck size={12} className="text-rp-laranja flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-rp-cinza-medio">
                        {fonte === 'nr1'
                          ? `${risco.respondentes ?? 0} respondente${(risco.respondentes ?? 0) !== 1 ? 's' : ''} · ${risco.pessoas} no setor`
                          : `${risco.pessoas} pessoa${risco.pessoas !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="w-24 bg-rp-cinza-borda rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${risco.score}%`, backgroundColor: barColor }} />
                    </div>
                    <RiskBadge nivel={risco.nivel} />
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-rp-cinza-medio flex-shrink-0">
                      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selecionado && (
            <>
              <div className="bg-white rounded-xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-rp-azul">Dimensões psicossociais</h3>
                  <RiskBadge nivel={selecionado.nivel} />
                </div>
                <p className="text-xs text-rp-cinza-medio mb-3">
                  Setor · {selecionado.setor}
                  {fonte === 'nr1' && selecionado.respondentes != null && (
                    <span> · {selecionado.respondentes} respondente{selecionado.respondentes !== 1 ? 's' : ''} · {selecionado.pessoas} no setor</span>
                  )}
                </p>
                <RiskRadarChart dimensoes={mapDimensoes(selecionado.dimensoes)} />
              </div>

              {recomendacaoTitulo ? (
                <div className="bg-rp-azul-suave rounded-xl p-5">
                  <h4 className="text-sm font-bold text-rp-azul mb-1">{recomendacaoTitulo}</h4>
                  {typeof recomendacao === 'object' && recomendacao?.descricao && (
                    <p className="text-xs text-rp-cinza-medio mb-3">{recomendacao.descricao}</p>
                  )}
                  {fonte !== 'nr1' ? (
                    <div className="flex gap-2 mt-3">
                      <Button variant="primary" size="sm" onClick={() => setShowPlanoModal(true)}>
                        <ClipboardList size={13} /> Criar plano de ação
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={marcandoRevisao}
                        onClick={handleRevisao}
                      >
                        <BookmarkCheck size={13} />
                        {selecionado.para_revisao ? 'Desmarcar revisão' : 'Marcar para revisão'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] font-medium text-rp-cinza-medio italic mt-3">
                      * Planos de ação e revisões para NR-1 são gerenciados no módulo de SSO correspondente.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 shadow-card text-center">
                  <p className="text-sm text-rp-cinza-medio">Nenhum alerta crítico neste setor.</p>
                  <span className="inline-block mt-2 text-green-600 text-xs font-semibold">✓ Situação estável</span>
                </div>
              )}
            </>
          )}

          {!selecionado && !loading && (
            <div className="bg-white rounded-xl p-8 shadow-card text-center">
              <p className="text-sm text-rp-cinza-medio">Selecione um setor para ver os detalhes.</p>
            </div>
          )}
        </div>
      </div>

      {showPlanoModal && selecionado && (
        <PlanoAcaoModal
          setorId={selecionado.setor_id}
          onClose={() => setShowPlanoModal(false)}
          onSaved={() => setShowPlanoModal(false)}
        />
      )}
    </div>
  )
}
