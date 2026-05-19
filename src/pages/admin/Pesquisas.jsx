import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Copy, Trash2, X } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { pesquisaAdminService, setorService } from '../../services/adminService'
import { formatDate } from '../../utils/formatters'

const tabs = [
  { key: 'todas', label: 'Todas' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'encerrada', label: 'Encerradas' },
  { key: 'rascunho', label: 'Rascunhos' },
]

const TIPO_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'clima', label: 'Clima' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'nps', label: 'NPS' },
  { value: 'risco', label: 'Risco' },
  { value: '360', label: '360°' },
  { value: 'cultura', label: 'Cultura' },
]

function FiltroSelect({ value, onChange, options }) {
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

export default function PesquisasAdmin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('todas')
  const [pesquisas, setPesquisas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [setores, setSetores] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')

  useEffect(() => {
    setorService.listar().then((res) => setSetores(res.data ?? [])).catch(() => {})
  }, [])

  const carregar = useCallback((status, tipo, setor) => {
    setLoading(true)
    const params = {}
    if (status && status !== 'todas') params.status = status
    if (tipo) params.tipo = tipo
    if (setor) params.setor = setor
    pesquisaAdminService.listar(params)
      .then((data) => {
        setPesquisas(data.data ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar('todas', '', '') }, [carregar])

  function handleTab(tab) {
    setActiveTab(tab)
    carregar(tab, filtroTipo, filtroSetor)
  }

  function handleFiltroTipo(v) {
    setFiltroTipo(v)
    carregar(activeTab, v, filtroSetor)
  }

  function handleFiltroSetor(v) {
    setFiltroSetor(v)
    carregar(activeTab, filtroTipo, v)
  }

  function limparFiltros() {
    setFiltroTipo('')
    setFiltroSetor('')
    carregar(activeTab, '', '')
  }

  const filtrosAtivos = filtroTipo !== '' || filtroSetor !== ''

  const setorOptions = [
    { value: '', label: 'Todos os setores' },
    ...setores.map((s) => ({ value: String(s.id), label: s.nome })),
  ]

  const counts = {
    todas: total,
    ativa: pesquisas.filter((p) => p.status === 'ativa').length,
    encerrada: pesquisas.filter((p) => p.status === 'encerrada').length,
    rascunho: pesquisas.filter((p) => p.status === 'rascunho').length,
  }

  const filtered = pesquisas

  return (
    <div>
      <PageTitle
        title="Gestão de pesquisas"
        subtitle="Crie, monitore e analise as escutas da sua empresa"
        action={
          <Button variant="primary" onClick={() => navigate('/admin/pesquisas/nova')}>
            <Plus size={14} /> Nova pesquisa
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rp-cinza-borda">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-rp-azul text-white'
                    : 'text-rp-cinza-medio hover:text-rp-texto hover:bg-rp-cinza-claro'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/70' : 'text-rp-cinza-medio'}`}>
                  ({counts[tab.key]})
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <FiltroSelect value={filtroTipo} onChange={handleFiltroTipo} options={TIPO_OPTIONS} />
            <FiltroSelect value={filtroSetor} onChange={handleFiltroSetor} options={setorOptions} />
            {filtrosAtivos && (
              <button onClick={limparFiltros} className="flex items-center gap-1 text-xs text-rp-cinza-medio hover:text-rp-texto transition-colors">
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-rp-cinza-medio">Carregando pesquisas...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rp-cinza-borda">
                <th className="text-left px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Pesquisa</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden md:table-cell">Tipo</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Respostas</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Participação</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-rp-cinza-medio">
                    Nenhuma pesquisa encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const respostas = p.responderam ?? p.respostas_count ?? 0
                const totalCol = p.total_respondentes ?? p.total ?? 0
                const participacao = totalCol > 0 ? Math.round((respostas / totalCol) * 100) : 0
                return (
                  <tr key={p.id} className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rp-azul-suave flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="1" width="12" height="12" rx="2" stroke="#003366" strokeWidth="1.3"/>
                            <path d="M4 5h6M4 7.5h6M4 10h4" stroke="#003366" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-rp-texto">{p.titulo}</p>
                          <p className="text-xs text-rp-cinza-medio mt-0.5">
                            {p.perguntas_count ?? p.perguntas_total ?? 0} perguntas
                            {p.prazo ? ` · encerra ${formatDate(p.prazo)}` : ' · encerra —'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 hidden md:table-cell">
                      <span className="text-sm text-rp-cinza-medio">{p.tipo}</span>
                    </td>
                    <td className="px-3 py-4">
                      <Badge label={p.status.toUpperCase()} variant={p.status} />
                    </td>
                    <td className="px-3 py-4 hidden lg:table-cell">
                      <span className="text-sm font-medium text-rp-texto">
                        {totalCol > 0 ? `${respostas} / ${totalCol}` : respostas > 0 ? String(respostas) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-4 hidden lg:table-cell">
                      {totalCol > 0 ? (
                        <div className="flex items-center gap-2">
                          <ProgressBar value={participacao} className="w-24" height="h-1.5" />
                          <span className="text-sm font-medium text-rp-texto">{participacao}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-rp-cinza-medio">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-rp-azul-suave text-rp-cinza-medio hover:text-rp-azul transition-colors">
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-rp-azul-suave text-rp-cinza-medio hover:text-rp-azul transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => pesquisaAdminService.duplicar(p.id).catch(console.error)}
                          className="p-1.5 rounded-lg hover:bg-rp-azul-suave text-rp-cinza-medio hover:text-rp-azul transition-colors"
                        >
                          <Copy size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-rp-cinza-medio hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-rp-cinza-borda flex items-center justify-between">
          <p className="text-xs text-rp-cinza-medio">Mostrando {filtered.length} de {total} pesquisas</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded border border-rp-cinza-borda text-rp-cinza-medio hover:bg-rp-cinza-claro">‹</button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-rp-azul text-white text-xs font-semibold">1</button>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-rp-cinza-borda text-rp-cinza-medio hover:bg-rp-cinza-claro text-xs">2</button>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-rp-cinza-borda text-rp-cinza-medio hover:bg-rp-cinza-claro">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
