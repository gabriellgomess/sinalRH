import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Grid, ClipboardList, Edit2, Check, AlertTriangle, Package, Plus, X, ExternalLink, RefreshCw, CreditCard, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService, plataformaProdutoService } from '../../services/plataformaService'
import { formatDate } from '../../utils/formatters'

const PRODUTOS_CATALOGO = {
  mapa_riscos:     { titulo: 'Mapa de Riscos',                 tipoSugerido: 'recorrente' },
  pesquisas:       { titulo: 'Pesquisas e Clima',             tipoSugerido: 'recorrente' },
  checkins:        { titulo: 'Check-ins Semanais',            tipoSugerido: 'recorrente' },
  diagnostico_nr1: { titulo: 'Diagnóstico Psicossocial NR-1', tipoSugerido: 'unica' },
  plano_acao_nr1:  { titulo: 'Plano de Ação Continuado NR-1', tipoSugerido: 'recorrente' },
  canal_escuta:    { titulo: 'Canal de Escuta Profissional',  tipoSugerido: 'recorrente' },
  feedback:        { titulo: 'Feedback 360',                  tipoSugerido: 'recorrente' },
  pdi:             { titulo: 'Plano de Desenvolvimento (PDI)', tipoSugerido: 'recorrente' },
}

const CICLOS = { WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual' }

const STATUS_PRODUTO = {
  ativo:        { label: 'Ativo',        cls: 'bg-green-100 text-green-700', dotCls: 'bg-green-500' },
  pausado:      { label: 'Pausado',      cls: 'bg-yellow-100 text-yellow-700', dotCls: 'bg-yellow-500' },
  encerrado:    { label: 'Encerrado',    cls: 'bg-gray-100 text-gray-500', dotCls: 'bg-gray-400' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700', dotCls: 'bg-red-500' },
}

const statusStyle = {
  ativo:     { badge: 'bg-green-100 text-green-700',   label: 'Ativo' },
  suspenso:  { badge: 'bg-yellow-100 text-yellow-700', label: 'Suspenso' },
  cancelado: { badge: 'bg-gray-100 text-gray-500',     label: 'Cancelado' },
}

const planoStyle = {
  enterprise: 'bg-purple-100 text-purple-700',
  pleno:      'bg-blue-100 text-blue-700',
  starter:    'bg-green-100 text-green-700',
  free:       'bg-gray-100 text-gray-500',
}

const planos = ['free', 'starter', 'pleno', 'enterprise']
const perfilLabel = { admin: 'Admin', gestor: 'Gestor', consultor: 'Consultor' }

function formatBRL(v) {
  if (v === null || v === undefined || v === '') return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

const emptyProdForm = {
  produto: 'diagnostico_nr1',
  tipo: 'unica',
  valor_unico: '',
  valor_mensal: '',
  ciclo: 'MONTHLY',
  data_inicio: new Date().toISOString().substring(0, 10),
  observacoes: '',
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ plano: '', max_colaboradores: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [removerModalAberto, setRemoverModalAberto] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  const [produtos, setProdutos] = useState([])
  const [colaboradoresAtivos, setColaboradoresAtivos] = useState(0)
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false)
  const [formProduto, setFormProduto] = useState(emptyProdForm)
  const [salvandoProduto, setSalvandoProduto] = useState(false)
  const [erroProduto, setErroProduto] = useState('')
  const [asaasWarning, setAsaasWarning] = useState('')
  const [resyncingId, setResyncingId] = useState(null)

  const [selecionadoProduto, setSelecionadoProduto] = useState(null)
  const [produtoModalAberto, setProdutoModalAberto] = useState(false)
  const [editandoProduto, setEditandoProduto] = useState(false)
  const [salvandoEditProduto, setSalvandoEditProduto] = useState(false)
  const [erroEditProduto, setErroEditProduto] = useState('')
  const [formEditProduto, setFormEditProduto] = useState({ tipo: 'unica', valor_unico: '', valor_mensal: '', ciclo: 'MONTHLY', data_inicio: '', observacoes: '' })

  useEffect(() => {
    plataformaEmpresaService.buscar(id).then(setEmpresa).catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function carregarProdutos() {
    try {
      const res = await plataformaProdutoService.listar(id)
      setProdutos(res.data?.produtos ?? [])
      setColaboradoresAtivos(res.data?.colaboradores_ativos ?? 0)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { carregarProdutos() }, [id])

  function setFP(k, v) { setFormProduto((f) => ({ ...f, [k]: v })) }
  function setFEP(k, v) { setFormEditProduto((f) => ({ ...f, [k]: v })) }

  function payloadCobranca(f) {
    const unica = f.tipo === 'unica' || f.tipo === 'ambas'
    const recorrente = f.tipo === 'recorrente' || f.tipo === 'ambas'
    return {
      tipo: f.tipo,
      valor_unico: unica && f.valor_unico !== '' && f.valor_unico !== null ? Number(f.valor_unico) : null,
      valor_mensal: recorrente && f.valor_mensal !== '' && f.valor_mensal !== null ? Number(f.valor_mensal) : null,
      ciclo: recorrente ? (f.ciclo || 'MONTHLY') : null,
    }
  }

  function resumoCobranca(p) {
    const parts = []
    if ((p.tipo === 'unica' || p.tipo === 'ambas') && p.valor_unico) parts.push(`Única ${formatBRL(p.valor_unico)}`)
    if ((p.tipo === 'recorrente' || p.tipo === 'ambas') && p.valor_mensal) parts.push(`${formatBRL(p.valor_mensal)}/${(CICLOS[p.ciclo] || 'Mensal').toLowerCase()}`)
    return parts.length ? parts.join(' + ') : 'Sem valor definido'
  }

  function abrirNovoProdutoModal() {
    const disponiveis = Object.keys(PRODUTOS_CATALOGO).filter((key) => !produtos.some((p) => p.produto === key))
    const prim = disponiveis[0] ?? 'diagnostico_nr1'
    setFormProduto({ ...emptyProdForm, produto: prim, tipo: PRODUTOS_CATALOGO[prim]?.tipoSugerido ?? 'unica' })
    setErroProduto('')
    setNovoProdutoAberto(true)
  }

  async function contratarProduto() {
    setSalvandoProduto(true); setErroProduto('')
    try {
      const payload = {
        produto: formProduto.produto,
        ...payloadCobranca(formProduto),
        data_inicio: formProduto.data_inicio,
        observacoes: formProduto.observacoes || null,
      }
      const resp = await plataformaProdutoService.contratar(id, payload)
      setAsaasWarning(resp?.asaas_warning?.mensagem || '')
      await carregarProdutos()
      setNovoProdutoAberto(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar contrato.'))
    } finally {
      setSalvandoProduto(false)
    }
  }

  function abrirProdutoModal(produto) {
    setSelecionadoProduto(produto)
    setProdutoModalAberto(true)
    setEditandoProduto(false)
    setErroEditProduto('')
  }
  function fecharProdutoModal() {
    setSelecionadoProduto(null); setProdutoModalAberto(false); setEditandoProduto(false)
  }
  function iniciarEdicaoProduto() {
    setFormEditProduto({
      tipo: selecionadoProduto.tipo ?? 'unica',
      valor_unico: selecionadoProduto.valor_unico ?? '',
      valor_mensal: selecionadoProduto.valor_mensal ?? '',
      ciclo: selecionadoProduto.ciclo ?? 'MONTHLY',
      data_inicio: selecionadoProduto.data_inicio ? selecionadoProduto.data_inicio.substring(0, 10) : '',
      observacoes: selecionadoProduto.observacoes ?? '',
    })
    setEditandoProduto(true); setErroEditProduto('')
  }
  async function salvarEdicaoProduto() {
    setSalvandoEditProduto(true); setErroEditProduto('')
    try {
      const payload = {
        ...payloadCobranca(formEditProduto),
        data_inicio: formEditProduto.data_inicio || undefined,
        observacoes: formEditProduto.observacoes || null,
      }
      await plataformaProdutoService.atualizar(id, selecionadoProduto.id, payload)
      await carregarProdutos()
      const res = await plataformaProdutoService.listar(id)
      const fresh = (res.data?.produtos ?? []).find((p) => p.id === selecionadoProduto.id)
      if (fresh) setSelecionadoProduto(fresh); else fecharProdutoModal()
      setEditandoProduto(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroEditProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar alterações.'))
    } finally {
      setSalvandoEditProduto(false)
    }
  }

  async function alterarStatusProduto(produto, novoStatus) {
    try {
      await plataformaProdutoService.atualizar(id, produto.id, { status: novoStatus })
      await carregarProdutos()
      setSelecionadoProduto((p) => (p ? { ...p, status: novoStatus } : p))
    } catch { alert('Erro ao alterar status.') }
  }
  async function removerProduto(produto) {
    if (!window.confirm(`Remover contrato de "${PRODUTOS_CATALOGO[produto.produto]?.titulo || produto.produto}"? Esta ação não pode ser desfeita.`)) return
    try {
      await plataformaProdutoService.remover(id, produto.id)
      await carregarProdutos()
      fecharProdutoModal()
    } catch { alert('Erro ao remover contrato.') }
  }
  async function reSincronizarAsaas(produto) {
    setResyncingId(produto.id); setAsaasWarning('')
    try {
      await plataformaProdutoService.sincronizarAsaas(id, produto.id)
      await carregarProdutos()
      const res = await plataformaProdutoService.listar(id)
      const fresh = (res.data?.produtos ?? []).find((p) => p.id === produto.id)
      if (fresh) setSelecionadoProduto(fresh)
    } catch (err) {
      setAsaasWarning(err.response?.data?.message || 'Falha ao re-sincronizar com Asaas.')
    } finally {
      setResyncingId(null)
    }
  }

  function startEdit() {
    setEditForm({ plano: empresa.plano, max_colaboradores: empresa.max_colaboradores ?? '' })
    setEditMode(true)
  }
  async function saveEdit() {
    setSaving(true); setError('')
    try {
      const updated = await plataformaEmpresaService.atualizar(id, {
        plano: editForm.plano,
        max_colaboradores: editForm.max_colaboradores ? Number(editForm.max_colaboradores) : undefined,
      })
      setEmpresa((prev) => ({ ...prev, ...updated }))
      setEditMode(false)
    } catch { setError('Erro ao salvar alterações.') } finally { setSaving(false) }
  }
  async function toggleStatus() {
    const novoStatus = empresa.status === 'ativo' ? 'suspenso' : 'ativo'
    setError('')
    try {
      const updated = await plataformaEmpresaService.atualizar(id, { status: novoStatus })
      setEmpresa((prev) => ({ ...prev, status: updated.status }))
    } catch { setError('Erro ao atualizar status.') }
  }
  async function confirmarRemocao() {
    setRemovendo(true); setError('')
    try {
      await plataformaEmpresaService.cancelar(id)
      navigate('/plataforma/clientes')
    } catch { setError('Erro ao excluir o cliente.'); setRemoverModalAberto(false) } finally { setRemovendo(false) }
  }

  function camposCobranca(form, setter) {
    const unica = form.tipo === 'unica' || form.tipo === 'ambas'
    const recorrente = form.tipo === 'recorrente' || form.tipo === 'ambas'
    return (
      <>
        <div>
          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Tipo de cobrança</label>
          <select value={form.tipo} onChange={(e) => setter('tipo', e.target.value)} className="input-field text-sm">
            <option value="unica">Cobrança única</option>
            <option value="recorrente">Recorrente</option>
            <option value="ambas">Única + Recorrente</option>
          </select>
        </div>
        {unica && (
          <div>
            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Valor da cobrança única (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valor_unico} onChange={(e) => setter('valor_unico', e.target.value)} placeholder="Ex: 2000" className="input-field text-sm" />
          </div>
        )}
        {recorrente && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Valor recorrente (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valor_mensal} onChange={(e) => setter('valor_mensal', e.target.value)} placeholder="Ex: 500" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Ciclo</label>
              <select value={form.ciclo} onChange={(e) => setter('ciclo', e.target.value)} className="input-field text-sm">
                {Object.entries(CICLOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        )}
      </>
    )
  }

  if (loading) return <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando...</div>
  if (!empresa) return <div className="py-12 text-center text-sm text-red-600">Empresa não encontrada.</div>

  const st = statusStyle[empresa.status] ?? statusStyle.ativo
  const unidades = (empresa.setores ?? []).reduce((acc, s) => {
    const key = s.unidade || 'Geral'; if (!acc[key]) acc[key] = []; acc[key].push(s); return acc
  }, {})
  const totalMensal = produtos
    .filter((p) => p.status === 'ativo' && (p.tipo === 'recorrente' || p.tipo === 'ambas'))
    .reduce((sum, p) => sum + Number(p.valor_mensal ?? 0), 0)
  const produtosNaoContratados = Object.entries(PRODUTOS_CATALOGO).filter(([key]) => !produtos.some((p) => p.produto === key))

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/plataforma/clientes')} className="p-2 rounded-lg hover:bg-white border border-rp-cinza-borda text-rp-cinza-medio transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-rp-azul truncate">{empresa.nome_fantasia}</h1>
          {empresa.razao_social && <p className="text-sm text-rp-cinza-medio">{empresa.razao_social}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${planoStyle[empresa.plano] ?? planoStyle.free}`}>{empresa.plano}</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.badge}`}>{st.label}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {asaasWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">{asaasWarning}</div>
          <button onClick={() => setAsaasWarning('')} className="text-yellow-700 hover:text-yellow-900"><X size={14} /></button>
        </div>
      )}
      {empresa.asaas_customer_id && (
        <div className="bg-blue-50 border border-blue-100 text-rp-azul text-xs px-3 py-2 rounded-lg mb-4 inline-flex items-center gap-2">
          <Check size={12} className="text-green-600" />
          <span className="font-semibold">Cliente Asaas:</span>
          <code className="font-mono bg-white px-2 py-0.5 rounded text-rp-texto">{empresa.asaas_customer_id}</code>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users,        label: 'Empregados',      value: empresa.colaboradores_count ?? 0, note: `de ${empresa.max_colaboradores ?? '∞'}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Grid,         label: 'Setores',         value: empresa.setores_count ?? 0, color: 'text-rp-azul', bg: 'bg-rp-azul-suave' },
          { icon: ClipboardList,label: 'Pesquisas',       value: empresa.pesquisas_count ?? 0, color: 'text-rp-laranja', bg: 'bg-orange-50' },
          { icon: CreditCard,   label: 'Recorrente/mês',  value: formatBRL(totalMensal), color: 'text-rp-azul', bg: 'bg-blue-50' },
        ].map(({ icon: Icon, label, value, note, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}><Icon size={16} className={color} strokeWidth={1.8} /></div>
            <p className="text-2xl font-bold text-rp-azul">{value}</p>
            <p className="text-xs text-rp-cinza-medio mt-0.5">{label}</p>
            {note && <p className="text-[10px] text-rp-cinza-medio">{note}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Empresa + Ações */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rp-azul">Dados da empresa</h3>
              {!editMode && (
                <button onClick={startEdit} className="flex items-center gap-1.5 text-xs text-rp-cinza-medio hover:text-rp-azul transition-colors"><Edit2 size={12} /> Editar</button>
              )}
            </div>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rp-texto mb-2">Plano</label>
                  <div className="grid grid-cols-2 gap-2">
                    {planos.map((p) => (
                      <button key={p} type="button" onClick={() => setEditForm((f) => ({ ...f, plano: p }))}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${editForm.plano === p ? 'border-rp-azul bg-rp-azul-suave' : 'border-rp-cinza-borda hover:border-rp-azul/40'}`}>
                        <span className={`text-sm font-semibold capitalize ${editForm.plano === p ? 'text-rp-azul' : 'text-rp-texto'}`}>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-rp-texto mb-1.5">Limite de empregados</label>
                  <input type="number" value={editForm.max_colaboradores} onChange={(e) => setEditForm((f) => ({ ...f, max_colaboradores: e.target.value }))} className="input-field" min="1" />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" loading={saving} onClick={saveEdit}>Salvar</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {[
                  ['CNPJ', empresa.cnpj || '—'],
                  ['E-mail de contato', empresa.email_contato || '—'],
                  ['Telefone', empresa.telefone || '—'],
                  ['Limite de empregados', empresa.max_colaboradores ?? '—'],
                  ['Recorrente/mês (produtos)', formatBRL(totalMensal)],
                  ['Cliente desde', formatDate(empresa.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-rp-cinza-borda last:border-0">
                    <span className="text-xs text-rp-cinza-medio">{label}</span>
                    <span className="text-sm font-medium text-rp-texto">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-rp-azul mb-1">Ações</h3>
            {empresa.status !== 'cancelado' && (
              <Button variant="outline" fullWidth onClick={toggleStatus}>
                {empresa.status === 'ativo' ? (<><AlertTriangle size={14} /> Suspender acesso</>) : (<><Check size={14} /> Reativar acesso</>)}
              </Button>
            )}
            <Button variant="danger" fullWidth onClick={() => setRemoverModalAberto(true)} className="bg-rp-critico text-white hover:bg-red-700 font-bold">
              <Trash2 size={14} /> Excluir Cliente
            </Button>
          </div>
        </div>

        {/* Coluna 2: Usuários + Setores */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-bold text-rp-azul mb-4">Usuários ({empresa.users?.length ?? 0})</h3>
            <div className="space-y-3">
              {(empresa.users ?? []).map((u) => (
                <div key={u.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#003366' }}>{u.nome?.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rp-texto truncate">{u.nome}</p>
                    <p className="text-xs text-rp-cinza-medio truncate">{u.email}</p>
                    <span className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide">{perfilLabel[u.perfil] ?? u.perfil}</span>
                  </div>
                </div>
              ))}
              {(empresa.users ?? []).length === 0 && <p className="text-xs text-rp-cinza-medio text-center py-2">Nenhum usuário.</p>}
            </div>
          </div>

          {Object.keys(unidades).length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-bold text-rp-azul mb-4">Setores ({empresa.setores_count ?? 0})</h3>
              <div className="space-y-4">
                {Object.entries(unidades).map(([unidade, setores]) => (
                  <div key={unidade}>
                    <p className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">{unidade}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {setores.map((s) => <span key={s.id} className="text-xs bg-rp-cinza-claro text-rp-texto px-2.5 py-1 rounded-lg">{s.nome}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3: Produtos */}
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rp-azul flex items-center gap-2"><Package size={14} /> Produtos ({produtos.length})</h3>
              <Button variant="outline" size="sm" onClick={abrirNovoProdutoModal}><Plus size={12} /> Novo produto</Button>
            </div>
            {produtos.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                <Package size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                <p className="text-sm text-rp-cinza-medio">Nenhum produto contratado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {produtos.map((p) => {
                  const sp = STATUS_PRODUTO[p.status] ?? STATUS_PRODUTO.ativo
                  return (
                    <button key={p.id} onClick={() => abrirProdutoModal(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-rp-cinza-claro hover:bg-rp-azul-suave border border-rp-cinza-borda hover:border-rp-azul/30 rounded-xl text-left transition-all">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sp.dotCls}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-rp-texto truncate">{PRODUTOS_CATALOGO[p.produto]?.titulo || p.produto}</p>
                        <p className="text-[10px] text-rp-cinza-medio">{resumoCobranca(p)}</p>
                      </div>
                    </button>
                  )
                })}
                <div className="mt-3 pt-3 border-t border-rp-cinza-borda text-[11px] text-rp-cinza-medio">
                  Empregados ativos: <strong className="text-rp-azul">{colaboradoresAtivos}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Novo Produto */}
      {novoProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex items-center gap-2"><Package className="text-rp-azul" size={18} /><h3 className="font-bold text-rp-azul text-base">Novo Produto</h3></div>
              <button onClick={() => setNovoProdutoAberto(false)} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {produtosNaoContratados.length === 0 ? (
                <div className="py-8 text-center">
                  <Package size={32} className="mx-auto text-rp-cinza-medio mb-2" />
                  <p className="text-sm font-semibold text-rp-texto">Todos os produtos já foram habilitados.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Produto</label>
                    <select value={formProduto.produto} onChange={(e) => setFP('produto', e.target.value)} className="input-field text-sm">
                      {produtosNaoContratados.map(([key, p]) => <option key={key} value={key}>{p.titulo}</option>)}
                    </select>
                  </div>
                  {camposCobranca(formProduto, setFP)}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de início</label>
                      <input type="date" value={formProduto.data_inicio} onChange={(e) => setFP('data_inicio', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Nº do Contrato</label>
                      <input value="Gerado automaticamente..." disabled className="input-field text-sm bg-rp-cinza-claro text-rp-cinza-medio cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Observações</label>
                    <textarea rows={3} value={formProduto.observacoes} onChange={(e) => setFP('observacoes', e.target.value)} placeholder="Notas internas" className="input-field text-sm resize-none" />
                  </div>
                  {erroProduto && <p className="text-xs text-red-600 font-semibold">{erroProduto}</p>}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-end gap-2 bg-rp-cinza-claro flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setNovoProdutoAberto(false)}>Cancelar</Button>
              {produtosNaoContratados.length > 0 && <Button variant="primary" size="sm" loading={salvandoProduto} onClick={contratarProduto}>Habilitar produto</Button>}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe/Edição de Produto */}
      {produtoModalAberto && selecionadoProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-rp-azul text-base truncate">{PRODUTOS_CATALOGO[selecionadoProduto.produto]?.titulo || selecionadoProduto.produto}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PRODUTO[selecionadoProduto.status]?.cls ?? 'bg-green-100 text-green-700'}`}>{STATUS_PRODUTO[selecionadoProduto.status]?.label ?? selecionadoProduto.status}</span>
                </div>
                <p className="text-xs text-rp-cinza-medio">Contrato: <span className="font-mono">{selecionadoProduto.numero_contrato ?? '—'}</span></p>
              </div>
              <button onClick={fecharProdutoModal} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500 flex-shrink-0"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!editandoProduto ? (
                <div className="space-y-5">
                  <div className="bg-rp-cinza-claro/50 rounded-xl p-4 border border-rp-cinza-borda space-y-2">
                    <h4 className="text-xs font-bold text-rp-azul uppercase tracking-wider mb-1">Cobrança</h4>
                    <p className="text-sm font-semibold text-rp-texto">{resumoCobranca(selecionadoProduto)}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                      <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Data de Início</span><strong className="text-sm text-rp-texto">{selecionadoProduto.data_inicio ? new Date(selecionadoProduto.data_inicio).toLocaleDateString('pt-BR') : '—'}</strong></div>
                      <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Ciclo</span><strong className="text-sm text-rp-texto">{(selecionadoProduto.tipo === 'recorrente' || selecionadoProduto.tipo === 'ambas') ? (CICLOS[selecionadoProduto.ciclo] || 'Mensal') : '—'}</strong></div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-1.5">Observações Internas</span>
                    <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-3.5 text-xs text-rp-texto min-h-[50px] whitespace-pre-wrap">
                      {selecionadoProduto.observacoes || <span className="text-rp-cinza-medio italic">Nenhuma observação.</span>}
                    </div>
                  </div>

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <h4 className="text-xs font-bold text-rp-azul uppercase tracking-wider mb-2">Integração Asaas</h4>
                    <div className="bg-rp-cinza-claro/50 border border-rp-cinza-borda rounded-xl p-4 flex flex-col gap-3">
                      {(selecionadoProduto.asaas_subscription_id || selecionadoProduto.asaas_payment_id) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-green-700"><span className="w-2 h-2 rounded-full bg-green-500" /> Sincronizado com Asaas</div>
                          <div className="text-xs space-y-1 bg-white border border-rp-cinza-borda rounded-lg p-2.5 font-mono text-rp-texto">
                            {selecionadoProduto.asaas_subscription_id && <div><span className="text-rp-cinza-medio">Assinatura:</span> {selecionadoProduto.asaas_subscription_id}</div>}
                            {selecionadoProduto.asaas_payment_id && <div><span className="text-rp-cinza-medio">Cobrança:</span> {selecionadoProduto.asaas_payment_id}</div>}
                          </div>
                          {selecionadoProduto.asaas_invoice_url && (
                            <a href={selecionadoProduto.asaas_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-rp-azul hover:text-rp-laranja"><ExternalLink size={13} /> Abrir Fatura no Asaas</a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Não sincronizado</div>
                          <button onClick={() => reSincronizarAsaas(selecionadoProduto)} disabled={resyncingId === selecionadoProduto.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rp-azul-suave border border-rp-cinza-borda rounded-lg text-xs font-bold text-rp-azul disabled:opacity-50">
                            <RefreshCw size={12} className={resyncingId === selecionadoProduto.id ? 'animate-spin' : ''} />
                            {resyncingId === selecionadoProduto.id ? 'Sincronizando...' : 'Sincronizar Agora'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-2.5">Ações</span>
                    <div className="flex flex-wrap gap-2">
                      {selecionadoProduto.status === 'ativo' && <button onClick={() => alterarStatusProduto(selecionadoProduto, 'pausado')} className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-xs font-semibold text-yellow-700 rounded-xl">Pausar</button>}
                      {selecionadoProduto.status === 'pausado' && <button onClick={() => alterarStatusProduto(selecionadoProduto, 'ativo')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-semibold text-green-700 rounded-xl">Reativar</button>}
                      {selecionadoProduto.status !== 'encerrado' && <button onClick={() => alterarStatusProduto(selecionadoProduto, 'encerrado')} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl">Encerrar</button>}
                      <button onClick={() => removerProduto(selecionadoProduto)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-600 rounded-xl ml-auto">Excluir</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {camposCobranca(formEditProduto, setFEP)}
                  <div>
                    <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de Início</label>
                    <input type="date" value={formEditProduto.data_inicio} onChange={(e) => setFEP('data_inicio', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Observações Internas</label>
                    <textarea rows={3} value={formEditProduto.observacoes} onChange={(e) => setFEP('observacoes', e.target.value)} className="input-field text-sm resize-none" />
                  </div>
                  {erroEditProduto && <p className="text-xs text-red-600 font-semibold">{erroEditProduto}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              {!editandoProduto ? (
                <>
                  <Button variant="outline" size="sm" onClick={fecharProdutoModal}>Fechar</Button>
                  <Button variant="primary" size="sm" onClick={iniciarEdicaoProduto}><Edit2 size={13} className="mr-1 inline" /> Editar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditandoProduto(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" loading={salvandoEditProduto} onClick={salvarEdicaoProduto}>Salvar Alterações</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir Cliente */}
      {removerModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-rp-cinza-borda">
            <div className="px-6 py-5 flex flex-col items-center text-center border-b border-rp-cinza-borda bg-red-50/50">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3"><AlertTriangle size={24} /></div>
              <h3 className="font-bold text-rp-azul text-lg">Excluir Cliente?</h3>
              <p className="text-xs text-rp-cinza-medio mt-1">A empresa será removida do ambiente ativo (soft-delete).</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-rp-texto leading-relaxed">Confirmar exclusão de <strong className="text-rp-azul">{empresa.nome_fantasia}</strong>?</p>
            </div>
            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-center gap-3 bg-rp-cinza-claro">
              <Button variant="outline" size="sm" onClick={() => setRemoverModalAberto(false)} disabled={removendo}>Cancelar</Button>
              <Button variant="danger" size="sm" loading={removendo} onClick={confirmarRemocao} className="bg-rp-critico text-white hover:bg-red-700 font-semibold">Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
