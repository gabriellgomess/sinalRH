import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Filter, AlertTriangle, Plus, Pencil, Trash2,
  CheckCircle, Clock, XCircle, MinusCircle, ChevronDown, ChevronUp,
  Paperclip, Upload, FileText, History, CalendarRange, FolderOpen, Folder, Archive,
  Sparkles, Play, RefreshCw, Copy, Check,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid,
} from 'recharts'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { nr1AdminService } from '../../services/nr1Service'
import { SEXO_OPTIONS, FAIXA_ETARIA_OPTIONS } from '../../constants/checklistSections'

// ── constantes ────────────────────────────────────────────────────────────

const NIVEL_CONFIG = {
  alto:  { label: 'Alto risco',     bar: 'bg-red-400' },
  medio: { label: 'Risco moderado', bar: 'bg-yellow-400' },
  baixo: { label: 'Baixo risco',    bar: 'bg-green-500' },
}

const SECAO_LABELS = [
  '',
  'Demandas de Trabalho',
  'Controle e Autonomia',
  'Clareza de Papel e Expectativas',
  'Relacionamentos e Justiça Organizacional',
  'Reconhecimento e Recompensa',
  'Suporte e Segurança Psicológica',
  'Condições Organizacionais e Comunicação',
  'Gestão de Mudanças',
  'Segurança e Situações Críticas',
  'Integração e Trabalho Remoto',
]

const STATUS_ACAO = {
  planejada:    { label: 'Planejada',    icon: Clock,        cls: 'bg-indigo-50 text-indigo-700' },
  em_andamento: { label: 'Em andamento', icon: ChevronDown,  cls: 'bg-yellow-50 text-yellow-700' },
  concluida:    { label: 'Concluída',    icon: CheckCircle,  cls: 'bg-green-50 text-green-700' },
  cancelada:    { label: 'Cancelada',    icon: XCircle,      cls: 'bg-gray-100 text-gray-500' },
}

const PRIORIDADE_CLS = {
  alta:  'bg-red-50 text-red-700',
  media: 'bg-yellow-50 text-yellow-700',
  baixa: 'bg-green-50 text-green-700',
}

function nivelScore(score) {
  if (score === null) return 'alto'
  if (score >= 70) return 'baixo'
  if (score >= 40) return 'medio'
  return 'alto'
}

function ScoreCard({ label, value, sub, color = 'text-rp-azul' }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-rp-cinza-medio mt-0.5">{sub}</p>}
    </div>
  )
}

const ACAO_VAZIA = {
  secao: '', setor_id: '', risco_descricao: '', acao: '',
  responsavel: '', responsavel_cargo: '', data_prevista: '', prioridade: 'media',
}

function AcaoForm({ avaliacao, setores, acaoEditando, onSalvo, onCancelar }) {
  const [form, setForm] = useState(acaoEditando
    ? {
        secao: acaoEditando.secao ?? '',
        setor_id: acaoEditando.setor_id ?? '',
        risco_descricao: acaoEditando.risco_descricao ?? '',
        acao: acaoEditando.acao ?? '',
        responsavel: acaoEditando.responsavel ?? '',
        responsavel_cargo: acaoEditando.responsavel_cargo ?? '',
        data_prevista: acaoEditando.data_prevista?.substring(0, 10) ?? '',
        prioridade: acaoEditando.prioridade ?? 'media',
        status: acaoEditando.status ?? 'planejada',
      }
    : ACAO_VAZIA
  )
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.risco_descricao.trim() || !form.acao.trim() || !form.responsavel.trim()) {
      setErro('Risco, ação e responsável são obrigatórios.')
      return
    }
    setSaving(true)
    setErro('')
    try {
      const payload = {
        ...form,
        secao:    form.secao   ? Number(form.secao)   : null,
        setor_id: form.setor_id ? Number(form.setor_id) : null,
      }
      if (acaoEditando) {
        await nr1AdminService.atualizarAcao(avaliacao.id, acaoEditando.id, payload)
      } else {
        await nr1AdminService.criarAcao(avaliacao.id, payload)
      }
      onSalvo()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao salvar ação.'
      setErro(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-rp-azul-suave border border-rp-azul/20 rounded-xl p-5 mb-4">
      <p className="text-sm font-bold text-rp-azul mb-4">
        {acaoEditando ? 'Editar ação' : 'Nova ação corretiva'}
      </p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Risco identificado *</label>
          <textarea
            rows={2}
            value={form.risco_descricao}
            onChange={e => set('risco_descricao', e.target.value)}
            placeholder="Descreva o risco psicossocial identificado..."
            className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Ação proposta *</label>
          <textarea
            rows={2}
            value={form.acao}
            onChange={e => set('acao', e.target.value)}
            placeholder="Descreva a ação corretiva ou preventiva..."
            className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 resize-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Responsável *</label>
          <input
            value={form.responsavel}
            onChange={e => set('responsavel', e.target.value)}
            placeholder="Nome do responsável"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Cargo</label>
          <input
            value={form.responsavel_cargo}
            onChange={e => set('responsavel_cargo', e.target.value)}
            placeholder="Cargo / função"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Prazo</label>
          <input
            type="date"
            value={form.data_prevista}
            onChange={e => set('data_prevista', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Dimensão (seção)</label>
          <select value={form.secao} onChange={e => set('secao', e.target.value)} className="input-field">
            <option value="">Geral / transversal</option>
            {SECAO_LABELS.slice(1).map((l, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}. {l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Setor</label>
          <select value={form.setor_id} onChange={e => set('setor_id', e.target.value)} className="input-field">
            <option value="">Toda a empresa</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Prioridade</label>
          <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)} className="input-field">
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>
      {acaoEditando && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field w-48">
            {Object.entries(STATUS_ACAO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}
      {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={saving}>
          {acaoEditando ? 'Salvar alterações' : 'Adicionar ação'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
      </div>
    </form>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

function AnexosAcao({ avaliacaoId, acao, onChange }) {
  const [aberto, setAberto] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [anexos, setAnexos] = useState(acao.anexos ?? [])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErro('')
    try {
      const res = await nr1AdminService.uploadAnexo(avaliacaoId, acao.id, file)
      setAnexos((prev) => [res.data, ...prev])
      onChange?.()
    } catch (err) {
      const msg = err.response?.data?.errors?.arquivo?.[0]
        || err.response?.data?.message
        || 'Falha ao enviar arquivo.'
      setErro(msg)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleExcluir(anexoId) {
    if (!window.confirm('Remover esta evidência?')) return
    try {
      await nr1AdminService.excluirAnexo(avaliacaoId, acao.id, anexoId)
      setAnexos((prev) => prev.filter((a) => a.id !== anexoId))
      onChange?.()
    } catch {
      alert('Erro ao remover anexo.')
    }
  }

  async function handleBaixar(anexo) {
    try {
      await nr1AdminService.baixarAnexo(avaliacaoId, acao.id, anexo.id, anexo.nome_original)
    } catch {
      alert('Erro ao baixar anexo.')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-rp-cinza-borda">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 text-xs text-rp-cinza-medio hover:text-rp-azul transition-colors"
      >
        <Paperclip size={12} />
        <span className="font-semibold">Evidências ({anexos.length})</span>
        {aberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {aberto && (
        <div className="mt-3">
          {anexos.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center gap-2 bg-rp-cinza-claro/60 rounded-lg px-3 py-2">
                  <FileText size={13} className="text-rp-azul flex-shrink-0" />
                  <button
                    onClick={() => handleBaixar(anexo)}
                    className="flex-1 text-left text-xs text-rp-texto hover:text-rp-azul truncate"
                    title={anexo.nome_original}
                  >
                    {anexo.nome_original}
                  </button>
                  <span className="text-[10px] text-rp-cinza-medio flex-shrink-0">{formatBytes(anexo.tamanho_bytes)}</span>
                  <button
                    onClick={() => handleExcluir(anexo.id)}
                    className="text-rp-cinza-medio hover:text-red-500 transition-colors flex-shrink-0"
                    title="Remover"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-rp-azul hover:text-rp-azul-profundo cursor-pointer">
            <Upload size={12} />
            {uploading ? 'Enviando...' : 'Anexar evidência'}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          {erro && <p className="text-[11px] text-red-600 mt-1">{erro}</p>}
          <p className="text-[10px] text-rp-cinza-medio mt-1">
            PDF, imagens, Word, Excel · máx. 10 MB
          </p>
        </div>
      )}
    </div>
  )
}

function GanttCronograma({ acoes }) {
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const responsaveis = useMemo(() => {
    return [...new Set(acoes.map(a => a.responsavel).filter(Boolean))].sort()
  }, [acoes])

  const acoesFiltradas = useMemo(() => {
    return acoes.filter(a => {
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
      if (filtroResponsavel && a.responsavel !== filtroResponsavel) return false
      return true
    })
  }, [acoes, filtroStatus, filtroResponsavel])

  const { inicioGantt, fimGantt, meses } = useMemo(() => {
    const hoje = new Date()
    if (acoesFiltradas.length === 0) {
      const i = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const f = new Date(hoje.getFullYear(), hoje.getMonth() + 5, 0)
      return { inicioGantt: i, fimGantt: f, meses: gerarMeses(i, f) }
    }

    const datas = []
    acoesFiltradas.forEach(a => {
      datas.push(new Date(a.created_at))
      if (a.data_prevista) datas.push(new Date(a.data_prevista))
      if (a.data_conclusao) datas.push(new Date(a.data_conclusao))
    })
    datas.push(hoje)

    const min = new Date(Math.min(...datas))
    const max = new Date(Math.max(...datas))
    const inicio = new Date(min.getFullYear(), min.getMonth(), 1)
    const fim = new Date(max.getFullYear(), max.getMonth() + 1, 0)
    return { inicioGantt: inicio, fimGantt: fim, meses: gerarMeses(inicio, fim) }
  }, [acoesFiltradas])

  function pct(data) {
    const total = fimGantt - inicioGantt
    const pos = new Date(data) - inicioGantt
    return Math.max(0, Math.min(100, (pos / total) * 100))
  }

  const hoje = new Date()
  const hojePct = pct(hoje)
  const corBarra = {
    planejada:    'bg-indigo-400',
    em_andamento: 'bg-yellow-400',
    concluida:    'bg-green-500',
    cancelada:    'bg-gray-300',
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-rp-azul">Cronograma de Execução</p>
          <p className="text-xs text-rp-cinza-medio mt-0.5">
            Linha do tempo das ações do plano · {acoesFiltradas.length} de {acoes.length} ações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="text-xs border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30"
          >
            <option value="todos">Todos os status</option>
            <option value="planejada">Planejadas</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <select
            value={filtroResponsavel}
            onChange={e => setFiltroResponsavel(e.target.value)}
            className="text-xs border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 max-w-[180px]"
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {acoesFiltradas.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarRange size={28} className="mx-auto text-rp-cinza-medio mb-2" />
          <p className="text-sm text-rp-cinza-medio">Nenhuma ação corresponde aos filtros selecionados.</p>
        </div>
      ) : (
        <>
          {/* Régua de meses */}
          <div className="flex border-b border-rp-cinza-borda ml-[200px] mb-2 relative">
            {meses.map((m, i) => (
              <div
                key={i}
                style={{ width: `${100 / meses.length}%` }}
                className="text-[10px] font-semibold text-rp-cinza-medio uppercase tracking-wide py-1.5 border-l border-rp-cinza-borda/60 text-center"
              >
                {m.label}
              </div>
            ))}
            {hojePct >= 0 && hojePct <= 100 && (
              <div
                className="absolute top-0 w-0.5 h-4 bg-rp-laranja z-10"
                style={{ left: `${hojePct}%` }}
                title="Hoje"
              />
            )}
          </div>

          {/* Linhas de ações */}
          <div className="space-y-1.5">
            {acoesFiltradas.map(acao => {
              const inicio = new Date(acao.created_at)
              const fim = acao.data_conclusao
                ? new Date(acao.data_conclusao)
                : (acao.data_prevista ? new Date(acao.data_prevista) : hoje)
              const inicioP = pct(inicio)
              const fimP = pct(fim)
              const width = Math.max(1.5, fimP - inicioP)
              const atrasada = acao.status !== 'concluida' && acao.status !== 'cancelada'
                && acao.data_prevista && new Date(acao.data_prevista) < hoje
              return (
                <div key={acao.id} className="flex items-center gap-2 group">
                  <div className="w-[200px] flex-shrink-0 truncate pr-2" title={acao.acao}>
                    <p className="text-xs font-medium text-rp-texto truncate">{acao.acao}</p>
                    <p className="text-[10px] text-rp-cinza-medio truncate">
                      {acao.responsavel}
                      {atrasada && <span className="ml-1 text-red-500 font-bold">· atrasada</span>}
                    </p>
                  </div>
                  <div className="flex-1 relative h-7 bg-rp-cinza-claro/40 rounded">
                    {meses.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-rp-cinza-borda/30"
                        style={{ left: `${(100 / meses.length) * i}%` }}
                      />
                    ))}
                    {hojePct >= 0 && hojePct <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rp-laranja/60 z-10"
                        style={{ left: `${hojePct}%` }}
                      />
                    )}
                    <div
                      className={`absolute top-1 bottom-1 rounded ${corBarra[acao.status] ?? 'bg-gray-300'} ${atrasada ? 'ring-1 ring-red-400' : ''} hover:opacity-80 cursor-help`}
                      style={{ left: `${inicioP}%`, width: `${width}%` }}
                      title={`${acao.acao}\nInício: ${inicio.toLocaleDateString('pt-BR')}\nPrazo: ${acao.data_prevista ? new Date(acao.data_prevista).toLocaleDateString('pt-BR') : 'sem prazo'}\nStatus: ${acao.status}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-rp-cinza-borda text-[11px] text-rp-cinza-medio">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-400 inline-block" /> Planejada</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Em andamento</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Concluída</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-300 inline-block" /> Cancelada</span>
            <span className="flex items-center gap-1.5 ml-auto"><span className="w-0.5 h-3 bg-rp-laranja inline-block" /> Hoje</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-1 ring-red-400 bg-red-50 inline-block" /> Atrasada</span>
          </div>
        </>
      )}
    </div>
  )
}

function gerarMeses(inicio, fim) {
  const meses = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  while (cursor <= fim) {
    meses.push({
      ano: cursor.getFullYear(),
      mes: cursor.getMonth(),
      label: cursor.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return meses
}

function DossieAuditoria({ avaliacaoId, codigo, versao }) {
  const [arvore, setArvore] = useState([])
  const [pastaAtiva, setPastaAtiva] = useState('00')
  const [subpastaAtiva, setSubpastaAtiva] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [pastaMeta, setPastaMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [erroUpload, setErroUpload] = useState('')
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [novoMesAberto, setNovoMesAberto] = useState(false)
  const [novoMesNome, setNovoMesNome] = useState('')

  async function carregarArvore() {
    setLoading(true)
    try {
      const res = await nr1AdminService.dossieArvore(avaliacaoId)
      setArvore(res.data?.arvore ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function carregarPasta(pasta, subpasta = null) {
    setLoadingArquivos(true)
    setPastaAtiva(pasta)
    setSubpastaAtiva(subpasta)
    try {
      const res = await nr1AdminService.dossieListarPasta(avaliacaoId, pasta, subpasta)
      setArquivos(res.data?.arquivos ?? [])
      setPastaMeta(res.data?.pasta ?? null)
    } catch (e) { console.error(e) }
    finally { setLoadingArquivos(false) }
  }

  useEffect(() => { carregarArvore() }, [avaliacaoId])
  useEffect(() => { carregarPasta('00') }, [avaliacaoId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErroUpload('')
    try {
      await nr1AdminService.dossieUpload(avaliacaoId, pastaAtiva, file, subpastaAtiva)
      await Promise.all([carregarArvore(), carregarPasta(pastaAtiva, subpastaAtiva)])
    } catch (err) {
      setErroUpload(err.response?.data?.errors?.arquivo?.[0] || err.response?.data?.message || 'Falha ao enviar.')
    } finally {
      setUploading(false); e.target.value = ''
    }
  }

  async function handleExcluir(arq) {
    if (!window.confirm(`Remover "${arq.nome_original}" do dossie?`)) return
    try {
      await nr1AdminService.dossieExcluirArquivo(avaliacaoId, arq.id)
      await Promise.all([carregarArvore(), carregarPasta(pastaAtiva, subpastaAtiva)])
    } catch { alert('Erro ao remover.') }
  }

  async function handleBaixar(arq) {
    try { await nr1AdminService.dossieBaixarArquivo(avaliacaoId, arq.id, arq.nome_original) }
    catch { alert('Erro ao baixar.') }
  }

  async function handleBaixarZip() {
    setDownloadingZip(true)
    try { await nr1AdminService.dossieBaixarZip(avaliacaoId, codigo, versao) }
    catch { alert('Erro ao gerar o ZIP.') }
    finally { setDownloadingZip(false) }
  }

  async function criarNovoMes() {
    const nome = novoMesNome.trim() || `Mes_${(arvore.find(p => p.codigo === '06')?.subpastas?.length ?? 0) + 1}`
    const sanitizado = nome.replace(/[^A-Za-z0-9_-]/g, '_')
    setSubpastaAtiva(sanitizado)
    setPastaAtiva('06')
    setArquivos([])
    setPastaMeta(arvore.find(p => p.codigo === '06') ?? null)
    setNovoMesAberto(false)
    setNovoMesNome('')
    // A subpasta so eh criada de fato quando o primeiro arquivo for enviado
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando dossiê...</div>
  }

  const pastaAtual = arvore.find(p => p.codigo === pastaAtiva)
  const totalArquivos = arvore.reduce((s, p) => s + (p.total_arquivos ?? 0), 0)
  const totalBytes    = arvore.reduce((s, p) => s + (p.tamanho_total  ?? 0), 0)

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-rp-cinza-borda flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-rp-azul">Dossiê de Auditoria PGR/NR-1</p>
          <p className="text-xs text-rp-cinza-medio mt-0.5">
            {totalArquivos} arquivo{totalArquivos !== 1 ? 's' : ''} · {formatBytes(totalBytes)} · estrutura conforme NR-1
          </p>
        </div>
        <Button variant="primary" onClick={handleBaixarZip} loading={downloadingZip}>
          <Archive size={14} /> Baixar dossiê (.zip)
        </Button>
      </div>

      <div className="grid grid-cols-[280px_1fr] min-h-[500px]">
        {/* Sidebar pastas */}
        <div className="border-r border-rp-cinza-borda bg-rp-cinza-claro/30 overflow-y-auto">
          <ul className="py-2">
            {arvore.map(p => {
              const ativa = pastaAtiva === p.codigo && !subpastaAtiva
              return (
                <li key={p.codigo}>
                  <button
                    onClick={() => carregarPasta(p.codigo)}
                    className={`w-full flex items-start gap-2 px-4 py-2.5 text-left hover:bg-white transition-colors ${ativa ? 'bg-white border-l-2 border-rp-azul' : ''}`}
                    title={p.descricao}
                  >
                    {ativa ? <FolderOpen size={14} className="text-rp-azul flex-shrink-0 mt-0.5" /> : <Folder size={14} className="text-rp-cinza-medio flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${ativa ? 'text-rp-azul' : 'text-rp-texto'}`}>
                        <span className="text-rp-cinza-medio mr-1">{p.codigo}</span>
                        {p.titulo}
                      </p>
                      {p.total_arquivos > 0 && (
                        <p className="text-[10px] text-rp-cinza-medio mt-0.5">
                          {p.total_arquivos} arquivo{p.total_arquivos > 1 ? 's' : ''} · {formatBytes(p.tamanho_total)}
                        </p>
                      )}
                    </div>
                  </button>
                  {/* Subpastas de 06 */}
                  {p.codigo === '06' && (
                    <ul className="pl-6">
                      {(p.subpastas ?? []).map(sub => {
                        const ativa = pastaAtiva === '06' && subpastaAtiva === sub.nome
                        return (
                          <li key={sub.nome}>
                            <button
                              onClick={() => carregarPasta('06', sub.nome)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white text-xs transition-colors ${ativa ? 'bg-white border-l-2 border-rp-laranja text-rp-azul font-semibold' : 'text-rp-cinza-medio'}`}
                            >
                              {ativa ? <FolderOpen size={11} /> : <Folder size={11} />}
                              <span className="flex-1">{sub.nome}</span>
                              <span className="text-[10px]">{sub.total_arquivos}</span>
                            </button>
                          </li>
                        )
                      })}
                      {pastaAtiva === '06' && subpastaAtiva && !p.subpastas?.find(s => s.nome === subpastaAtiva) && (
                        <li>
                          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-rp-laranja bg-white border-l-2 border-rp-laranja">
                            <FolderOpen size={11} />
                            <span className="flex-1 font-semibold">{subpastaAtiva}</span>
                            <span className="text-[10px]">novo</span>
                          </div>
                        </li>
                      )}
                      {pastaAtiva === '06' && (
                        novoMesAberto ? (
                          <li className="px-3 py-1.5 flex items-center gap-1">
                            <input
                              value={novoMesNome}
                              onChange={e => setNovoMesNome(e.target.value)}
                              placeholder={`Mes_${(p.subpastas?.length ?? 0) + 1}`}
                              className="text-xs px-2 py-1 border border-rp-cinza-borda rounded flex-1"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && criarNovoMes()}
                            />
                            <button onClick={criarNovoMes} className="text-rp-azul"><CheckCircle size={13} /></button>
                            <button onClick={() => setNovoMesAberto(false)} className="text-rp-cinza-medio"><XCircle size={13} /></button>
                          </li>
                        ) : (
                          <li>
                            <button
                              onClick={() => setNovoMesAberto(true)}
                              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-rp-azul hover:bg-white"
                            >
                              <Plus size={11} /> Adicionar mês
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Painel arquivos */}
        <div className="p-5">
          {pastaMeta && (
            <div className="mb-4 pb-4 border-b border-rp-cinza-borda">
              <p className="text-sm font-bold text-rp-texto">
                <span className="text-rp-cinza-medio mr-1">{pastaAtiva}</span>
                {pastaMeta.titulo}
                {subpastaAtiva && <span className="text-rp-cinza-medio mx-2">›</span>}
                {subpastaAtiva && <span className="text-rp-laranja">{subpastaAtiva}</span>}
              </p>
              <p className="text-xs text-rp-cinza-medio mt-1">{pastaMeta.descricao}</p>
            </div>
          )}

          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-1.5 bg-rp-azul hover:bg-rp-azul/90 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors">
              <Upload size={13} />
              {uploading ? 'Enviando...' : 'Enviar arquivo'}
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-[11px] text-rp-cinza-medio">Máx. 50 MB · qualquer tipo (PDF, Word, Excel, imagem, etc.)</p>
          </div>

          {erroUpload && <p className="text-xs text-red-600 mb-3">{erroUpload}</p>}

          {loadingArquivos ? (
            <p className="text-sm text-rp-cinza-medio py-8 text-center">Carregando arquivos...</p>
          ) : arquivos.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
              <FileText size={28} className="mx-auto text-rp-cinza-medio mb-2" />
              <p className="text-sm text-rp-cinza-medio">Nenhum arquivo nesta pasta ainda.</p>
              <p className="text-xs text-rp-cinza-medio mt-1">Envie o primeiro documento para começar.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {arquivos.map(arq => (
                <div key={arq.id} className="flex items-center gap-3 bg-rp-cinza-claro/40 hover:bg-rp-cinza-claro rounded-lg px-3 py-2.5 transition-colors">
                  <FileText size={14} className="text-rp-azul flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleBaixar(arq)}
                      className="text-sm font-medium text-rp-texto hover:text-rp-azul truncate block text-left w-full"
                      title={arq.nome_original}
                    >
                      {arq.nome_original}
                    </button>
                    <p className="text-[10px] text-rp-cinza-medio">
                      {formatBytes(arq.tamanho_bytes)}
                      {arq.enviado_por?.nome && ` · enviado por ${arq.enviado_por.nome}`}
                      · {new Date(arq.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleBaixar(arq)}
                    className="p-1.5 text-rp-cinza-medio hover:text-rp-azul rounded hover:bg-white"
                    title="Baixar"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => handleExcluir(arq)}
                    className="p-1.5 text-rp-cinza-medio hover:text-red-500 rounded hover:bg-white"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────

export default function Nr1Resultados() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [aba, setAba] = useState('resultados')
  const [dados, setDados] = useState(null)
  const [loadingResultados, setLoadingResultados] = useState(true)
  const [filtros, setFiltros] = useState({ setor_id: '', sexo: '', faixa_etaria: '' })
  const [showFiltros, setShowFiltros] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Plano de ação
  const [plano, setPlano] = useState(null)
  const [loadingPlano, setLoadingPlano] = useState(false)
  const [showNovaAcao, setShowNovaAcao] = useState(false)
  const [acaoEditando, setAcaoEditando] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Aprovação
  const [formAprovacao, setFormAprovacao] = useState({ aprovado_por: '', aprovado_cargo: '', aprovado_em: '', proxima_avaliacao_em: '' })
  const [savingAprovacao, setSavingAprovacao] = useState(false)

  // Histórico
  const [historico, setHistorico] = useState(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // Relatório de IA (PGR)
  const [relatorioIa, setRelatorioIa] = useState(null)
  const [relatorioIaStatus, setRelatorioIaStatus] = useState(null)
  const [loadingIa, setLoadingIa] = useState(false)
  const [gerandoIa, setGerandoIa] = useState(false)
  const [copiedTextId, setCopiedTextId] = useState(null)
  const [expandedDim, setExpandedDim] = useState(null)

  const handleCopyText = (text, textId) => {
    navigator.clipboard.writeText(text)
    setCopiedTextId(textId)
    setTimeout(() => setCopiedTextId(null), 2000)
  }

  const carregarIAPgr = useCallback(async (mostrarLoading = true) => {
    if (mostrarLoading) setLoadingIa(true)
    try {
      const res = await nr1AdminService.obterRelatorioIA(id)
      if (res.success) {
        setRelatorioIaStatus(res.status)
        setRelatorioIa(res.dados)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (mostrarLoading) setLoadingIa(false)
    }
  }, [id])

  // Reactive Polling for AI report generation status
  useEffect(() => {
    let intervalId = null
    if (aba === 'ia_pgr' && relatorioIaStatus === 'gerando') {
      intervalId = setInterval(() => {
        carregarIAPgr(false)
      }, 12000)
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [aba, relatorioIaStatus, carregarIAPgr])

  async function dispararGeracaoIA() {
    setGerandoIa(true)
    try {
      const res = await nr1AdminService.gerarRelatorioIA(id)
      if (res.success) {
        setRelatorioIaStatus(res.status)
        if (res.dados) {
          setRelatorioIa(res.dados)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Falha ao gerar o relatório de IA.')
    } finally {
      setGerandoIa(false)
    }
  }

  async function carregarResultados(f = {}) {
    setLoadingResultados(true)
    try {
      const res = await nr1AdminService.resultados(id, f)
      setDados(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingResultados(false)
    }
  }

  async function carregarHistorico() {
    setLoadingHistorico(true)
    try {
      const res = await nr1AdminService.historico(id)
      setHistorico(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistorico(false)
    }
  }

  async function carregarPlano() {
    setLoadingPlano(true)
    try {
      const res = await nr1AdminService.planoAcao(id)
      setPlano(res.data)
      const av = res.data.avaliacao
      setFormAprovacao({
        aprovado_por: av.aprovado_por ?? '',
        aprovado_cargo: av.aprovado_cargo ?? '',
        aprovado_em: av.aprovado_em?.substring(0, 10) ?? '',
        proxima_avaliacao_em: av.proxima_avaliacao_em?.substring(0, 10) ?? '',
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPlano(false)
    }
  }

  useEffect(() => { carregarResultados() }, [id])

  function mudarAba(novaAba) {
    setAba(novaAba)
    if (novaAba === 'plano' && !plano) carregarPlano()
    if (novaAba === 'cronograma' && !plano) carregarPlano()
    if (novaAba === 'historico' && !historico) carregarHistorico()
    if (novaAba === 'ia_pgr') {
      carregarIAPgr()
    }
  }

  function aplicarFiltros() {
    const ativos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
    carregarResultados(ativos)
    setShowFiltros(false)
  }

  function limparFiltros() {
    setFiltros({ setor_id: '', sexo: '', faixa_etaria: '' })
    carregarResultados()
    setShowFiltros(false)
  }

  async function baixarPdf() {
    setPdfLoading(true)
    try {
      const ativos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      const codigo = dados?.avaliacao?.codigo ?? id
      await nr1AdminService.baixarPdf(id, ativos, `pgr-nr1-${codigo}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleExcluirAcao(acaoId) {
    if (!window.confirm('Remover esta ação do plano?')) return
    setDeletingId(acaoId)
    try {
      await nr1AdminService.excluirAcao(id, acaoId)
      await carregarPlano()
    } catch {
      alert('Erro ao remover ação.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAprovar(e) {
    e.preventDefault()
    if (!formAprovacao.aprovado_por.trim() || !formAprovacao.aprovado_em) {
      alert('Nome do responsável e data de aprovação são obrigatórios.')
      return
    }
    setSavingAprovacao(true)
    try {
      await nr1AdminService.aprovar(id, formAprovacao)
      await carregarPlano()
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao registrar aprovação.')
    } finally {
      setSavingAprovacao(false)
    }
  }

  // ── loading inicial ───────────────────────────────────────────────────

  if (loadingResultados && !dados) {
    return <div className="py-20 text-center text-sm text-rp-cinza-medio">Carregando resultados...</div>
  }
  if (!dados) return null

  const { avaliacao, scores, setores, plano_acao_ativo } = dados
  const isExpired = !!avaliacao.is_expirada
  const sc = scores ?? {}
  const scoreGeral = sc.score_geral
  const nivel = nivelScore(scoreGeral)
  const cfg = NIVEL_CONFIG[nivel]

  const radarData = (sc.por_secao ?? []).map((s) => ({
    dimensao: s.label.length > 20 ? s.label.substring(0, 18) + '…' : s.label,
    score: s.score ?? 0,
    fullLabel: s.label,
  }))

  const filtrosAtivos = Object.values(filtros).some((v) => v !== '')
  const acoes = plano?.avaliacao?.plano_acoes ?? []
  const avaliacaoPlano = plano?.avaliacao ?? null
  const setoresPlano = plano?.setores ?? setores ?? []

  const contagemStatus = acoes.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  // ── render ────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/nr1')}
            className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-texto transition-colors"
          >
            <ArrowLeft size={15} /> Avaliações NR-1
          </button>
          <span className="text-rp-cinza-borda">›</span>
          <span className="text-sm font-semibold text-rp-texto">{avaliacao.titulo}</span>
          <Badge label={isExpired ? 'EXPIRADA' : avaliacao.status.toUpperCase()} variant={isExpired ? 'critico' : avaliacao.status} />
        </div>
        <div className="flex gap-2">
          {aba === 'resultados' && (
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                filtrosAtivos
                  ? 'border-rp-azul text-rp-azul bg-rp-azul-suave'
                  : 'border-rp-cinza-borda text-rp-cinza-medio hover:bg-rp-cinza-claro'
              }`}
            >
              <Filter size={13} /> Filtros {filtrosAtivos && '●'}
            </button>
          )}
          <Button variant="primary" onClick={baixarPdf} loading={pdfLoading}>
            <Download size={14} /> PDF / PGR
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 bg-rp-cinza-claro rounded-xl p-1 w-fit">
        {[
          { key: 'resultados', label: 'Resultados' },
          { key: 'ia_pgr', label: 'Análise de IA (PGR)' },
          { key: 'plano', label: `Plano de Ação${acoes.length > 0 ? ` (${acoes.length})` : ''}` },
          { key: 'cronograma', label: 'Cronograma' },
          { key: 'dossie', label: 'Dossiê' },
          { key: 'historico', label: 'Histórico' },
        ].filter(tab => {
          if (['plano', 'cronograma', 'dossie'].includes(tab.key)) {
            return !!plano_acao_ativo;
          }
          return true;
        }).map(tab => (
          <button
            key={tab.key}
            onClick={() => mudarAba(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              aba === tab.key
                ? 'bg-white text-rp-azul shadow-sm'
                : 'text-rp-cinza-medio hover:text-rp-texto'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA RESULTADOS ── */}
      {aba === 'resultados' && (
        <>
          {showFiltros && (
            <div className="bg-white rounded-xl shadow-card p-5 mb-5">
              <p className="text-sm font-semibold text-rp-texto mb-4">Filtrar resultados</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Setor</label>
                  <select
                    value={filtros.setor_id}
                    onChange={(e) => setFiltros((f) => ({ ...f, setor_id: e.target.value }))}
                    className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30"
                  >
                    <option value="">Todos os setores</option>
                    {(setores ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Sexo</label>
                  <select
                    value={filtros.sexo}
                    onChange={(e) => setFiltros((f) => ({ ...f, sexo: e.target.value }))}
                    className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30"
                  >
                    <option value="">Todos</option>
                    {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Faixa etária</label>
                  <select
                    value={filtros.faixa_etaria}
                    onChange={(e) => setFiltros((f) => ({ ...f, faixa_etaria: e.target.value }))}
                    className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30"
                  >
                    <option value="">Todas</option>
                    {FAIXA_ETARIA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={limparFiltros} className="text-sm text-rp-cinza-medio hover:text-rp-texto transition-colors">Limpar filtros</button>
                <Button variant="primary" onClick={aplicarFiltros} className="ml-auto">Aplicar</Button>
              </div>
            </div>
          )}

          {loadingResultados && <div className="text-center text-xs text-rp-cinza-medio mb-4">Atualizando resultados...</div>}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <ScoreCard
              label="Score Geral PGR"
              value={scoreGeral !== null ? `${scoreGeral}%` : 'N/D'}
              sub={cfg.label}
              color={nivel === 'baixo' ? 'text-green-600' : nivel === 'medio' ? 'text-yellow-600' : 'text-red-600'}
            />
            <ScoreCard label="Respondentes" value={sc.total_respondentes ?? 0} sub="participações" />
            <ScoreCard label="Favoráveis (4 e 5)" value={sc.global?.S ?? 0} sub="respostas" color="text-green-600" />
            <ScoreCard label="Desfavoráveis (1 e 2)" value={sc.global?.N ?? 0} sub="respostas" color="text-red-600" />
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl shadow-card p-5">
              <p className="text-sm font-bold text-rp-texto mb-4">Score por dimensão psicossocial</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#e2e6ec" />
                    <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} tickCount={4} />
                    <Radar name="Score" dataKey="score" stroke="#003366" fill="#003366" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip
                      formatter={(v, _, { payload }) => [`${v}%`, payload?.fullLabel ?? 'Score']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-rp-cinza-medio">
                  Nenhuma resposta registrada ainda.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-card p-5">
              <p className="text-sm font-bold text-rp-texto mb-4">Resultado por dimensão</p>
              <div className="space-y-2.5">
                {(sc.por_secao ?? []).map((s) => {
                  const n = nivelScore(s.score)
                  const c = NIVEL_CONFIG[n]
                  const w = s.score !== null ? s.score : 0
                  return (
                    <div key={s.secao} className="flex items-center gap-3">
                      <span className="text-xs text-rp-cinza-medio w-4 flex-shrink-0">{s.secao}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-rp-texto truncate">{s.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-rp-cinza-claro rounded-full overflow-hidden">
                            <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${w}%` }} />
                          </div>
                          <span className="text-xs font-bold text-rp-texto w-9 text-right flex-shrink-0">
                            {s.score !== null ? `${s.score}%` : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-semibold">{s.S}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded font-semibold">{s.P}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-semibold">{s.N}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-rp-cinza-borda">
                <span className="flex items-center gap-1 text-xs text-green-700" title="Notas 4 e 5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />Favoráveis (4 e 5)</span>
                <span className="flex items-center gap-1 text-xs text-yellow-700" title="Nota 3"><span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200 inline-block" />Neutros (3)</span>
                <span className="flex items-center gap-1 text-xs text-red-700" title="Notas 1 e 2"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />Desfavoráveis (1 e 2)</span>
              </div>
            </div>
          </div>

          {(sc.itens_criticos ?? []).length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-500" />
                  <p className="text-sm font-bold text-rp-texto">Itens críticos — ≥ 30% de Desfavoráveis</p>
                </div>
                {plano_acao_ativo && (
                  <button
                    onClick={() => mudarAba('plano')}
                    className="text-xs text-rp-azul hover:underline font-medium"
                  >
                    Criar plano de ação →
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {sc.itens_criticos.map((item) => (
                  <div key={`${item.secao}-${item.item}`} className="flex items-center gap-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-rp-cinza-medio">Seção {item.secao} · Item {item.item}</p>
                      <p className="text-sm text-rp-texto truncate">{item.label}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-red-600">{item.pct_n}%</p>
                      <p className="text-xs text-rp-cinza-medio">{item.N}/{item.total} Neg.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ABA ANÁLISE DE IA (PGR) ── */}
      {aba === 'ia_pgr' && (
        <>
          {loadingIa ? (
            <div className="py-20 text-center text-sm text-rp-cinza-medio flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-rp-azul" size={24} />
              <span>Carregando dados da inteligência artificial...</span>
            </div>
          ) : (
            <>
              {(!relatorioIaStatus || relatorioIaStatus === null) && (
                <div className="bg-white rounded-xl shadow-card p-8 border border-rp-cinza-borda flex flex-col items-center text-center max-w-3xl mx-auto my-6 relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-rp-azul/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rp-azul/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="p-4 bg-rp-azul-suave text-rp-azul rounded-full mb-5">
                    <Sparkles size={36} className="text-rp-azul" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-rp-texto mb-2">Relatório de IA Especializado — PGR & NR-1</h3>
                  <p className="text-sm text-rp-cinza-medio max-w-xl mb-6">
                    Gere uma análise interpretativa coletiva e de engenharia humana focada no Gerenciamento de Riscos Ocupacionais (GRO).
                    O agente consolida as percepções de fatores psicossociais, identifica blocos críticos, sugere redações para o Inventário de Riscos e ações preventivas robustas.
                  </p>

                  <div className="flex gap-8 justify-center text-left border-y border-rp-cinza-borda py-5 w-full mb-6">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rp-texto">Segurança & LGPD</p>
                        <p className="text-[11px] text-rp-cinza-medio">Trava de anonimato automática de 5 respondentes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rp-texto">Integração NR-1 & NR-17</p>
                        <p className="text-[11px] text-rp-cinza-medio">Interpretação técnica alinhada com diretrizes do GRO.</p>
                      </div>
                    </div>
                  </div>
                  
                  {dados?.avaliacao?.status !== 'encerrada' && !isExpired ? (
                    <div className="w-full max-w-xl bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 mt-2 flex flex-col items-center gap-3 relative overflow-hidden backdrop-blur-sm">
                      <div className="p-3 bg-amber-100/80 text-amber-800 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} className="text-amber-700" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Análise de IA Bloqueada</h4>
                        <p className="text-xs text-amber-800/90 leading-relaxed">
                          Para gerar o diagnóstico inteligente PGR, a avaliação precisa estar com o status **Encerrada**. Isso garante que a análise interprete a totalidade das respostas dos colaboradores de forma consolidada e definitiva.
                        </p>
                      </div>
                      <div className="text-[11px] text-amber-700/80 mt-1 font-semibold flex items-center gap-1">
                        <Clock size={12} className="text-amber-600" />
                        Status atual da pesquisa: <span className="uppercase font-bold text-amber-800">{dados?.avaliacao?.status === 'ativa' ? 'Ativa (Coletando Respostas)' : 'Rascunho'}</span>
                      </div>
                    </div>
                  ) : (
                    <Button variant="primary" size="lg" onClick={dispararGeracaoIA} loading={gerandoIa}>
                      <Play size={15} className="mr-1.5" /> Iniciar Análise de IA
                    </Button>
                  )}
                </div>
              )}

              {relatorioIaStatus === 'gerando' && (
                <div className="bg-white rounded-xl shadow-card p-10 border border-rp-cinza-borda flex flex-col items-center text-center max-w-2xl mx-auto my-6 relative overflow-hidden">
                  <div className="p-4 bg-rp-azul-suave rounded-full mb-6 animate-pulse">
                    <RefreshCw size={36} className="text-rp-azul animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-rp-texto mb-2">O Agente de IA está consolidando o diagnóstico...</h3>
                  <p className="text-xs text-rp-cinza-medio max-w-md mb-8">
                    Isso pode levar de 30 a 60 segundos. O Agente está processando a base de dados sob as diretrizes de gerenciamento de riscos ocupacionais da NR-1.
                  </p>
                  
                  {/* Visual Stepper */}
                  <div className="w-full text-left space-y-4 max-w-md border-t border-rp-cinza-claro pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                      <p className="text-xs font-semibold text-rp-texto">Consolidando as notas estatísticas (Escala Likert 1-5)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                      <p className="text-xs font-semibold text-rp-texto">Higienizando dados demográficos (Trava de Anonimato LGPD)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rp-azul text-white flex items-center justify-center text-[10px] font-bold animate-pulse">●</div>
                      <p className="text-xs font-semibold text-rp-azul">Agente de IA interpretando dimensões organizacionais...</p>
                    </div>
                    <div className="flex items-center gap-3 opacity-40">
                      <div className="w-5 h-5 rounded-full bg-rp-cinza-medio text-white flex items-center justify-center text-[10px] font-bold">4</div>
                      <p className="text-xs font-semibold text-rp-cinza-medio">Estruturando sugestões de Inventário de Riscos & Plano de Ação PGR</p>
                    </div>
                  </div>
                </div>
              )}

              {relatorioIaStatus === 'erro' && (
                <div className="bg-white rounded-xl shadow-card p-8 border border-red-200 flex flex-col items-center text-center max-w-2xl mx-auto my-6">
                  <div className="p-3 bg-red-50 text-red-500 rounded-full mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-base font-bold text-rp-texto mb-2">Erro ao gerar análise de IA</h3>
                  <p className="text-xs text-rp-cinza-medio max-w-md mb-6">
                    Houve um problema de conexão ou timeout na comunicação com a API da OpenAI. Nenhuma resposta foi cobrada e seus dados continuam seguros.
                  </p>
                  <Button variant="primary" onClick={dispararGeracaoIA} loading={gerandoIa}>
                    <RefreshCw size={13} className="mr-1.5" /> Tentar Novamente
                  </Button>
                </div>
              )}

              {relatorioIaStatus === 'pronto' && relatorioIa && (
                <>
                  {/* Dashboard Visual */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-card p-5 border-l-4 border-rp-azul flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wider">Média Geral Likert</p>
                        <h4 className="text-3xl font-extrabold text-rp-texto mt-1 flex items-baseline gap-1">
                          {relatorioIa.resumo_executivo?.media_geral?.toFixed(2) || '—'}
                          <span className="text-sm font-normal text-rp-cinza-medio">/ 5.00</span>
                        </h4>
                      </div>
                      <p className="text-[10px] text-rp-cinza-medio mt-2">Média direta ponderada da empresa</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wider">Classificação de Risco</p>
                        <h4 className="text-xl font-extrabold mt-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            relatorioIa.resumo_executivo?.classificacao_geral?.toLowerCase()?.includes('alto')
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : relatorioIa.resumo_executivo?.classificacao_geral?.toLowerCase()?.includes('moderado')
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : relatorioIa.resumo_executivo?.classificacao_geral?.toLowerCase()?.includes('atenção')
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                            {relatorioIa.resumo_executivo?.classificacao_geral || 'N/D'}
                          </span>
                        </h4>
                      </div>
                      <p className="text-[10px] text-rp-cinza-medio mt-2">Critério alinhado com GRO/NR-1</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wider">Prioridade Geral</p>
                        <h4 className="text-lg font-bold text-rp-texto mt-1.5">
                          {relatorioIa.resumo_executivo?.prioridade_geral || 'N/A'}
                        </h4>
                      </div>
                      <p className="text-[10px] text-rp-cinza-medio mt-2 truncate" title={relatorioIa.resumo_executivo?.observacao}>
                        {relatorioIa.resumo_executivo?.observacao || 'Sem observações.'}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wider">Status do Diagnóstico</p>
                        <p className="text-[10px] text-rp-cinza-medio mt-1">A análise inteligente foi consolidada com sucesso após o fechamento da pesquisa.</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold mt-2 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                        <CheckCircle size={14} className="text-green-500" />
                        Análise Concluída
                      </div>
                    </div>
                  </div>

                  {/* Accordion List */}
                  <div className="bg-white rounded-xl shadow-card p-6">
                    <h4 className="text-sm font-bold text-rp-texto mb-4 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-rp-azul" /> Análise Interpretativa por Dimensão Psicossocial
                    </h4>
                    <div className="space-y-3">
                      {(relatorioIa.dimensoes || []).map((d, index) => {
                        const isExpanded = expandedDim === index;
                        const isDimHigh = d.classificacao?.toLowerCase()?.includes('alto');
                        const isDimMod = d.classificacao?.toLowerCase()?.includes('moderado');
                        const isDimAten = d.classificacao?.toLowerCase()?.includes('atenção');
                        const dimRiskColor = isDimHigh
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : isDimMod
                          ? 'text-orange-700 bg-orange-50 border-orange-200'
                          : isDimAten
                          ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                          : 'text-green-700 bg-green-50 border-green-200';

                        return (
                          <div key={index} className="border border-rp-cinza-borda rounded-xl overflow-hidden transition-all duration-200 hover:shadow-sm">
                            <button
                              onClick={() => setExpandedDim(isExpanded ? null : index)}
                              className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 bg-rp-cinza-claro/40 hover:bg-rp-cinza-claro/80 transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="text-xs font-semibold text-rp-cinza-medio">Dimensão {index + 1}</p>
                                <h5 className="text-sm font-bold text-rp-texto truncate">{d.dimensao}</h5>
                                <p className="text-[11px] text-rp-cinza-medio mt-0.5 truncate">{d.fator_avaliado}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-2 md:mt-0 flex-wrap">
                                <div className="flex gap-1">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700" title="Respostas Positivas (4 e 5)">{d.percentual_respostas_positivas}% Pos.</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700" title="Respostas Neutras (3)">{d.percentual_respostas_neutras}% Neu.</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700" title="Respostas Negativas (1 e 2)">{d.percentual_respostas_negativas}% Neg.</span>
                                </div>
                                <span className="text-xs font-extrabold text-rp-texto w-10 text-right">{d.media?.toFixed(2)}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${dimRiskColor}`}>{d.classificacao}</span>
                                {isExpanded ? <ChevronUp size={16} className="text-rp-cinza-medio" /> : <ChevronDown size={16} className="text-rp-cinza-medio" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-5 border-t border-rp-cinza-borda bg-white space-y-4">
                                <div>
                                  <h6 className="text-[10px] font-bold text-rp-texto uppercase tracking-wider mb-1">Interpretação Técnica do Agente</h6>
                                  <p className="text-sm text-rp-texto bg-rp-cinza-claro/30 rounded-lg p-3.5 leading-relaxed">{d.interpretacao}</p>
                                </div>

                                {d.perguntas_criticas?.length > 0 && (
                                  <div>
                                    <h6 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                      <AlertTriangle size={12} /> Perguntas Críticas na Dimensão (Notas 1 ou 2 frequentes)
                                    </h6>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {d.perguntas_criticas.map((pc, idx) => (
                                        <li key={idx} className="text-xs text-rp-texto leading-relaxed">{pc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h6 className="text-[10px] font-bold text-rp-texto uppercase tracking-wider mb-1.5">Possíveis Causas Organizacionais</h6>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {d.possiveis_causas_organizacionais?.map((pc, idx) => (
                                        <li key={idx} className="text-xs text-rp-cinza-medio leading-relaxed">{pc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h6 className="text-[10px] font-bold text-rp-texto uppercase tracking-wider mb-1.5">Medidas Coletivas / Preventivas Recomendadas</h6>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {d.medidas_recomendadas?.map((mr, idx) => (
                                        <li key={idx} className="text-xs text-rp-cinza-medio leading-relaxed">{mr}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-3.5 border-t border-rp-cinza-borda">
                                  <span className="text-xs font-bold text-rp-texto">
                                    Necessita Avaliação Complementar (SSO):{' '}
                                    <span className={d.necessita_avaliacao_complementar ? 'text-red-600' : 'text-green-600'}>
                                      {d.necessita_avaliacao_complementar ? 'Sim (Prioridade)' : 'Não aparente'}
                                    </span>
                                  </span>
                                  <span className="hidden sm:inline text-rp-cinza-borda">·</span>
                                  <span className="text-xs font-bold text-rp-texto">
                                    Encaminhamento PGR: <span className="text-rp-azul">{d.encaminhamento_pgr || 'Monitoramento Periódico'}</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PGR Toolkit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Inventário de Riscos */}
                    <div className="bg-white rounded-xl shadow-card p-6 border border-rp-cinza-borda flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-rp-texto flex items-center gap-1.5">
                            <FileText size={16} className="text-rp-azul" /> Sugestões para o Inventário de Riscos (GRO)
                          </h4>
                          <button
                            onClick={() => handleCopyText(
                              relatorioIa.sugestao_inventario_riscos?.join('\n\n') || '',
                              'inventario'
                            )}
                            className="flex items-center gap-1 text-xs text-rp-azul hover:underline font-semibold"
                          >
                            {copiedTextId === 'inventario' ? (
                              <>
                                <Check size={12} className="text-green-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copiar tudo
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-rp-cinza-medio mb-4">
                          Transcreva esses blocos diretamente para o inventário de riscos do seu Programa de Gerenciamento de Riscos (PGR).
                        </p>
                        <div className="bg-rp-cinza-claro/30 rounded-lg p-4 font-mono text-[11px] text-rp-texto h-64 overflow-y-auto whitespace-pre-wrap border border-rp-cinza-borda">
                          {relatorioIa.sugestao_inventario_riscos?.join('\n\n') || 'Nenhuma sugestão de inventário gerada.'}
                        </div>
                      </div>
                    </div>

                    {/* Plano de Ação */}
                    <div className="bg-white rounded-xl shadow-card p-6 border border-rp-cinza-borda flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-rp-texto flex items-center gap-1.5">
                            <Plus size={16} className="text-rp-azul" /> Sugestões para o Plano de Ação (PGR)
                          </h4>
                          <button
                            onClick={() => handleCopyText(
                              relatorioIa.sugestao_plano_acao?.join('\n\n') || '',
                              'plano_ia'
                            )}
                            className="flex items-center gap-1 text-xs text-rp-azul hover:underline font-semibold"
                          >
                            {copiedTextId === 'plano_ia' ? (
                              <>
                                <Check size={12} className="text-green-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copiar tudo
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-rp-cinza-medio mb-4">
                          Recomendações estruturadas prontas para inserção no cronograma de medidas do plano de ação de SSO da empresa.
                        </p>
                        <div className="bg-rp-cinza-claro/30 rounded-lg p-4 font-mono text-[11px] text-rp-texto h-64 overflow-y-auto whitespace-pre-wrap border border-rp-cinza-borda">
                          {relatorioIa.sugestao_plano_acao?.join('\n\n') || 'Nenhuma sugestão de plano de ação gerada.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations & Limitations Footer */}
                  <div className="bg-white rounded-xl shadow-card p-6 mt-6 border-l-4 border-yellow-400">
                    <h5 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Diretrizes Gerais & Limitações de Responsabilidade (NR-1)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                      <div>
                        <h6 className="text-[11px] font-bold text-rp-texto uppercase tracking-wide mb-1.5">Ações Preventivas Globais</h6>
                        <ul className="list-disc pl-4 space-y-1">
                          {(relatorioIa.recomendacoes_gerais || []).map((rg, idx) => (
                            <li key={idx} className="text-xs text-rp-texto leading-relaxed">{rg}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h6 className="text-[11px] font-bold text-rp-texto uppercase tracking-wide mb-1.5">Limitações Técnicas e Legais</h6>
                        <ul className="list-disc pl-4 space-y-1">
                          {(relatorioIa.limitacoes || []).map((l, idx) => (
                            <li key={idx} className="text-xs text-rp-cinza-medio leading-relaxed">{l}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="text-[10px] text-rp-cinza-medio mt-5 pt-4 border-t border-rp-cinza-borda leading-relaxed">
                      <strong>Aviso de Relatório (NR-1/SSO):</strong> Este relatório apresenta uma análise coletiva dos fatores de risco psicossociais relacionados ao trabalho, com base nas respostas dos participantes ao questionário aplicado. Os resultados não representam diagnóstico clínico individual, nem substituem avaliação técnica complementar, médica, psicológica, ergonômica ou de segurança e saúde no trabalho. As informações devem ser utilizadas como subsídio para o gerenciamento de riscos ocupacionais, podendo apoiar a atualização do inventário de riscos, a elaboração do plano de ação e a definição de medidas preventivas.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── ABA PLANO DE AÇÃO ── */}
      {aba === 'plano' && (
        <>
          {loadingPlano ? (
            <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando plano de ação...</div>
          ) : (
            <>
              {/* cabeçalho plano */}
              <div className="bg-white rounded-xl shadow-card p-5 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-rp-azul">Plano de Ação Corretiva e Preventiva</p>
                    <p className="text-xs text-rp-cinza-medio mt-0.5">
                      {acoes.length} ação{acoes.length !== 1 ? 'ões' : ''}
                      {contagemStatus.concluida ? ` · ${contagemStatus.concluida} concluída${contagemStatus.concluida !== 1 ? 's' : ''}` : ''}
                      {contagemStatus.em_andamento ? ` · ${contagemStatus.em_andamento} em andamento` : ''}
                      {contagemStatus.planejada ? ` · ${contagemStatus.planejada} planejada${contagemStatus.planejada !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setShowNovaAcao(true); setAcaoEditando(null) }}
                  >
                    <Plus size={13} /> Nova ação
                  </Button>
                </div>
              </div>

              {/* formulário nova/editar ação */}
              {(showNovaAcao && !acaoEditando) && (
                <AcaoForm
                  avaliacao={avaliacaoPlano ?? avaliacao}
                  setores={setoresPlano}
                  acaoEditando={null}
                  onSalvo={() => { setShowNovaAcao(false); carregarPlano() }}
                  onCancelar={() => setShowNovaAcao(false)}
                />
              )}

              {/* lista de ações */}
              {acoes.length === 0 && !showNovaAcao ? (
                <div className="bg-white rounded-xl shadow-card py-12 text-center">
                  <p className="text-sm text-rp-cinza-medio mb-3">Nenhuma ação cadastrada ainda.</p>
                  <Button variant="primary" size="sm" onClick={() => setShowNovaAcao(true)}>
                    <Plus size={13} /> Criar primeira ação
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {acoes.map(acao => {
                    const st = STATUS_ACAO[acao.status] ?? STATUS_ACAO.planejada
                    const isEditing = acaoEditando?.id === acao.id
                    return (
                      <div key={acao.id} className="bg-white rounded-xl shadow-card overflow-hidden">
                        {isEditing ? (
                          <div className="p-5">
                            <AcaoForm
                              avaliacao={avaliacaoPlano ?? avaliacao}
                              setores={setoresPlano}
                              acaoEditando={acao}
                              onSalvo={() => { setAcaoEditando(null); carregarPlano() }}
                              onCancelar={() => setAcaoEditando(null)}
                            />
                          </div>
                        ) : (
                          <div className="flex gap-0">
                            {/* barra de prioridade */}
                            <div className={`w-1 flex-shrink-0 ${
                              acao.prioridade === 'alta' ? 'bg-red-400'
                              : acao.prioridade === 'media' ? 'bg-yellow-400'
                              : 'bg-green-400'
                            }`} />
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORIDADE_CLS[acao.prioridade]}`}>
                                      {acao.prioridade?.toUpperCase()}
                                    </span>
                                    {acao.secao && (
                                      <span className="text-xs bg-rp-azul-suave text-rp-azul px-2 py-0.5 rounded-full font-medium">
                                        Seção {acao.secao}: {SECAO_LABELS[acao.secao]}
                                      </span>
                                    )}
                                    {acao.setor?.nome && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {acao.setor.nome}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-rp-cinza-medio mb-0.5">Risco identificado</p>
                                  <p className="text-sm text-rp-texto mb-2">{acao.risco_descricao}</p>
                                  <p className="text-xs font-semibold text-rp-cinza-medio mb-0.5">Ação proposta</p>
                                  <p className="text-sm text-rp-texto">{acao.acao}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => { setAcaoEditando(acao); setShowNovaAcao(false) }}
                                    className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-rp-cinza-claro transition-colors"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleExcluirAcao(acao.id)}
                                    disabled={deletingId === acao.id}
                                    className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-rp-cinza-borda text-xs text-rp-cinza-medio">
                                <span>
                                  <span className="font-semibold text-rp-texto">{acao.responsavel}</span>
                                  {acao.responsavel_cargo && ` · ${acao.responsavel_cargo}`}
                                </span>
                                {acao.data_prevista && (
                                  <span>Prazo: {new Date(acao.data_prevista).toLocaleDateString('pt-BR')}</span>
                                )}
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                                  {st.label}
                                </span>
                              </div>
                              <AnexosAcao avaliacaoId={id} acao={acao} onChange={carregarPlano} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Aprovação do PGR */}
              <div className="bg-white rounded-xl shadow-card p-5">
                <p className="text-sm font-bold text-rp-azul mb-1">Aprovação do Documento PGR</p>
                <p className="text-xs text-rp-cinza-medio mb-4">
                  Registre a aprovação formal do PGR. Esses dados aparecem no PDF como evidência documental para o MTE.
                </p>
                {avaliacaoPlano?.aprovado_por && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                    <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-700">
                        Aprovado por {avaliacaoPlano.aprovado_por}
                        {avaliacaoPlano.aprovado_cargo && ` (${avaliacaoPlano.aprovado_cargo})`}
                        {' '}em {new Date(avaliacaoPlano.aprovado_em).toLocaleDateString('pt-BR')}
                      </p>
                      {avaliacaoPlano.proxima_avaliacao_em && (
                        <p className="text-xs text-green-600">
                          Próxima avaliação: {new Date(avaliacaoPlano.proxima_avaliacao_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <form onSubmit={handleAprovar}>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Nome do responsável *</label>
                      <input
                        value={formAprovacao.aprovado_por}
                        onChange={e => setFormAprovacao(f => ({ ...f, aprovado_por: e.target.value }))}
                        placeholder="Ex: João Silva"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Cargo</label>
                      <input
                        value={formAprovacao.aprovado_cargo}
                        onChange={e => setFormAprovacao(f => ({ ...f, aprovado_cargo: e.target.value }))}
                        placeholder="Ex: Diretor de RH"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Data de aprovação *</label>
                      <input
                        type="date"
                        value={formAprovacao.aprovado_em}
                        onChange={e => setFormAprovacao(f => ({ ...f, aprovado_em: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Próxima avaliação prevista</label>
                      <input
                        type="date"
                        value={formAprovacao.proxima_avaliacao_em}
                        onChange={e => setFormAprovacao(f => ({ ...f, proxima_avaliacao_em: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" loading={savingAprovacao}>
                    <CheckCircle size={14} /> Registrar aprovação
                  </Button>
                </form>
              </div>
            </>
          )}
        </>
      )}

      {/* ── ABA CRONOGRAMA ── */}
      {aba === 'cronograma' && (
        <>
          {loadingPlano && !plano ? (
            <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando cronograma...</div>
          ) : acoes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card py-12 text-center">
              <CalendarRange size={32} className="mx-auto text-rp-cinza-medio mb-3" />
              <p className="text-sm text-rp-cinza-medio">Nenhuma ação cadastrada ainda.</p>
              <p className="text-xs text-rp-cinza-medio mt-1">Adicione ações no Plano para visualizar o cronograma.</p>
            </div>
          ) : (
            <GanttCronograma acoes={acoes} />
          )}
        </>
      )}

      {/* ── ABA DOSSIÊ ── */}
      {aba === 'dossie' && (
        <DossieAuditoria avaliacaoId={id} codigo={avaliacao.codigo} versao={avaliacao.versao} />
      )}

      {/* ── ABA HISTÓRICO ── */}
      {aba === 'historico' && (
        <>
          {loadingHistorico && !historico ? (
            <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando histórico de versões...</div>
          ) : !historico || historico.versoes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card py-12 text-center">
              <History size={32} className="mx-auto text-rp-cinza-medio mb-3" />
              <p className="text-sm text-rp-cinza-medio">Esta avaliação ainda não possui versões anteriores ou posteriores.</p>
              <p className="text-xs text-rp-cinza-medio mt-1">Crie uma nova versão na lista de avaliações para iniciar o histórico.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-card p-5 mb-4">
                <p className="text-sm font-bold text-rp-azul mb-1">Linha do tempo das versões</p>
                <p className="text-xs text-rp-cinza-medio mb-4">
                  Evolução do PGR ao longo das reavaliações periódicas.
                </p>
                <div className="space-y-2">
                  {historico.versoes.map((v) => {
                    const eAtual = v.id === historico.atual_id
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${eAtual ? 'bg-rp-azul-suave border border-rp-azul/30' : 'bg-rp-cinza-claro/60'}`}
                      >
                        <div className="w-10 text-center">
                          <p className="text-xs font-bold text-rp-azul">v{v.versao}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-rp-texto truncate">
                            {v.titulo}
                            {eAtual && <span className="ml-2 text-[10px] bg-rp-azul text-white px-1.5 py-0.5 rounded-full font-bold">ATUAL</span>}
                          </p>
                          <p className="text-xs text-rp-cinza-medio mt-0.5">
                            Status: {v.status} · {v.total_respondentes} respondentes
                            {v.aplicada_em && ` · aplicada em ${new Date(v.aplicada_em).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xl font-bold ${v.score_geral === null ? 'text-rp-cinza-medio' : v.score_geral >= 70 ? 'text-green-600' : v.score_geral >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {v.score_geral !== null ? `${v.score_geral}%` : '—'}
                          </p>
                          <p className="text-[10px] text-rp-cinza-medio uppercase tracking-wide">Score</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {historico.versoes.length > 1 && (
                <div className="bg-white rounded-xl shadow-card p-5">
                  <p className="text-sm font-bold text-rp-azul mb-1">Comparativo por dimensão</p>
                  <p className="text-xs text-rp-cinza-medio mb-4">
                    Score percentual de cada dimensão psicossocial entre as versões.
                  </p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={(() => {
                        const dimensoes = historico.versoes[0]?.por_secao ?? []
                        return dimensoes.map((d) => {
                          const linha = { dimensao: `S${d.secao}`, fullLabel: d.label }
                          historico.versoes.forEach((v) => {
                            const found = v.por_secao.find((s) => s.secao === d.secao)
                            linha[`v${v.versao}`] = found?.score ?? 0
                          })
                          return linha
                        })
                      })()}
                      margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
                      <XAxis dataKey="dimensao" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, '']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ''}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {historico.versoes.map((v, i) => {
                        const cores = ['#003366', '#e67e22', '#27ae60', '#9333ea', '#dc2626']
                        return (
                          <Bar
                            key={v.id}
                            dataKey={`v${v.versao}`}
                            name={`v${v.versao}${v.id === historico.atual_id ? ' (atual)' : ''}`}
                            fill={cores[i % cores.length]}
                          />
                        )
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
