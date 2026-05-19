import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Shield, Clock, X } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { escutaAdminService, setorService } from '../../services/adminService'
import { relativeTime } from '../../utils/formatters'

const statusConfig = {
  pendente:   { label: 'PENDENTE',   bg: 'bg-yellow-100 text-yellow-700' },
  em_analise: { label: 'EM ANÁLISE', bg: 'bg-blue-100 text-blue-700' },
  resolvido:  { label: 'RESOLVIDO',  bg: 'bg-green-100 text-green-700' },
  arquivado:  { label: 'ARQUIVADO',  bg: 'bg-gray-100 text-gray-500' },
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'arquivado', label: 'Arquivado' },
]

function FiltroSelect({ value, onChange, options, placeholder }) {
  const ativo = value !== ''
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 border rounded-lg text-sm font-medium cursor-pointer transition-colors focus:outline-none ${
          ativo
            ? 'border-rp-azul bg-rp-azul-suave text-rp-azul'
            : 'border-rp-cinza-borda bg-white text-rp-texto hover:bg-rp-cinza-claro'
        }`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rp-cinza-medio text-xs">▾</span>
    </div>
  )
}

export default function CanalEscuta() {
  const [relatos, setRelatos] = useState([])
  const [total, setTotal] = useState(0)
  const [selecionado, setSelecionado] = useState(null)
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [setores, setSetores] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')

  useEffect(() => {
    setorService.listar().then((res) => setSetores(res.data ?? [])).catch(() => {})
  }, [])

  const carregar = useCallback((status, setorId) => {
    setLoading(true)
    const params = {}
    if (status) params.status = status
    if (setorId) params.setor_id = setorId
    escutaAdminService.listar(params)
      .then((data) => {
        const lista = data.data ?? []
        setRelatos(lista)
        setTotal(data.total ?? lista.length)
        setSelecionado(lista[0] ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar('', '') }, [carregar])

  function handleFiltroStatus(v) {
    setFiltroStatus(v)
    carregar(v, filtroSetor)
  }

  function handleFiltroSetor(v) {
    setFiltroSetor(v)
    carregar(filtroStatus, v)
  }

  function limparFiltros() {
    setFiltroStatus('')
    setFiltroSetor('')
    carregar('', '')
  }

  async function handleStatus(novoStatus) {
    if (!selecionado) return
    try {
      await escutaAdminService.atualizarStatus(selecionado.id, novoStatus)
      const updated = { ...selecionado, status: novoStatus }
      setRelatos((prev) => prev.map((r) => r.id === selecionado.id ? updated : r))
      setSelecionado(updated)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleNota() {
    if (!nota.trim() || !selecionado) return
    try {
      await escutaAdminService.adicionarNota(selecionado.id, nota)
      setNota('')
    } catch (err) {
      console.error(err)
    }
  }

  const pendentes = relatos.filter((r) => r.status === 'pendente').length
  const filtrosAtivos = filtroStatus !== '' || filtroSetor !== ''

  const setorOptions = [
    { value: '', label: 'Todos os setores' },
    ...setores.map((s) => ({ value: String(s.id), label: s.nome })),
  ]

  return (
    <div>
      <PageTitle
        title="Canal de escuta"
        subtitle={`${total} relatos · ${pendentes} aguardando triagem`}
      />

      <div className="flex items-center gap-2 mb-4">
        <FiltroSelect value={filtroStatus} onChange={handleFiltroStatus} options={STATUS_OPTIONS} />
        <FiltroSelect value={filtroSetor} onChange={handleFiltroSetor} options={setorOptions} />
        {filtrosAtivos && (
          <button
            onClick={limparFiltros}
            className="flex items-center gap-1 text-xs text-rp-cinza-medio hover:text-rp-texto transition-colors"
          >
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-rp-cinza-medio">Carregando relatos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {relatos.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-card text-center">
                <MessageSquare size={28} className="text-rp-cinza-medio mx-auto mb-3" />
                <p className="text-sm text-rp-cinza-medio">Nenhum relato recebido.</p>
              </div>
            )}
            {relatos.map((r) => {
              const sc = statusConfig[r.status] || statusConfig.pendente
              return (
                <button
                  key={r.id}
                  onClick={() => setSelecionado(r)}
                  className={`w-full text-left bg-white rounded-xl p-4 shadow-card border-2 transition-all ${selecionado?.id === r.id ? 'border-rp-azul' : 'border-transparent hover:border-rp-azul/20'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-rp-azul flex-shrink-0" />
                      <span className="text-xs font-semibold text-rp-cinza-medio">
                        {r.modo === 'anonimo' ? 'Anônimo' : 'Identificado'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg}`}>{sc.label}</span>
                  </div>
                  <p className="text-xs font-semibold text-rp-laranja mb-1">{r.categoria?.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-rp-texto line-clamp-2 mb-2">{r.texto}</p>
                  <div className="flex items-center gap-1.5 text-xs text-rp-cinza-medio">
                    <Clock size={11} />
                    <span>{r.setor?.nome ?? 'Sem setor'} · {relativeTime(r.created_at)}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {selecionado && (
            <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className="text-rp-azul" />
                    <span className="text-sm font-semibold text-rp-texto">
                      {selecionado.modo === 'anonimo' ? 'Relato anônimo' : 'Relato identificado'}
                    </span>
                  </div>
                  <p className="text-xs text-rp-cinza-medio">
                    {selecionado.setor?.nome ?? 'Sem setor'} · {relativeTime(selecionado.created_at)}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(statusConfig[selecionado.status] || statusConfig.pendente).bg}`}>
                  {(statusConfig[selecionado.status] || statusConfig.pendente).label}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest">
                  {selecionado.categoria?.replace(/_/g, ' ')}
                </span>
                <p className="text-sm text-rp-texto mt-2 leading-relaxed">{selecionado.texto}</p>
              </div>

              <div className="bg-rp-azul-suave rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-rp-azul mb-2">Nota interna</p>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                  placeholder="Adicione uma nota interna sobre este relato..."
                  className="w-full bg-transparent text-sm text-rp-texto placeholder-rp-cinza-medio focus:outline-none resize-none"
                />
                {nota.trim() && (
                  <button
                    onClick={handleNota}
                    className="mt-2 text-xs text-rp-azul font-semibold hover:underline"
                  >
                    Salvar nota
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatus('em_analise')}
                  className="flex-1 py-2.5 rounded-lg bg-rp-azul text-white text-sm font-semibold hover:bg-rp-azul-deep transition-colors"
                >
                  Iniciar triagem
                </button>
                <button
                  onClick={() => handleStatus('resolvido')}
                  className="flex-1 py-2.5 rounded-lg border border-rp-cinza-borda text-rp-cinza-medio text-sm font-medium hover:bg-rp-cinza-claro transition-colors"
                >
                  Marcar resolvido
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
