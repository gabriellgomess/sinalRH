import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Grid, ClipboardList, Edit2, Check, AlertTriangle, Package, Plus, X, ExternalLink, RefreshCw, CreditCard, Trash2, Receipt } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService, plataformaProdutoService, plataformaCobrancaService } from '../../services/plataformaService'
import { formatDate } from '../../utils/formatters'

const PRODUTOS_CATALOGO = {
  mapa_riscos:     { titulo: 'Mapa de Riscos' },
  pesquisas:       { titulo: 'Pesquisas e Clima' },
  checkins:        { titulo: 'Check-ins Semanais' },
  diagnostico_nr1: { titulo: 'Diagnóstico Psicossocial NR-1' },
  plano_acao_nr1:  { titulo: 'Plano de Ação Continuado NR-1' },
  canal_escuta:    { titulo: 'Canal de Escuta Profissional' },
  feedback:        { titulo: 'Feedback 360' },
  pdi:             { titulo: 'Plano de Desenvolvimento (PDI)' },
  ead:             { titulo: 'EAD / Treinamentos' },
}

const CICLOS = { WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual' }
const BILLING_TYPES = { UNDEFINED: 'Cliente escolhe', BOLETO: 'Boleto', PIX: 'Pix', CREDIT_CARD: 'Cartão de crédito' }

const STATUS_PRODUTO = {
  ativo:        { label: 'Ativo',     cls: 'bg-green-100 text-green-700',  dotCls: 'bg-green-500' },
  pausado:      { label: 'Pausado',   cls: 'bg-yellow-100 text-yellow-700', dotCls: 'bg-yellow-500' },
  encerrado:    { label: 'Encerrado', cls: 'bg-gray-100 text-gray-500',    dotCls: 'bg-gray-400' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700',   dotCls: 'bg-red-500' },
}

const STATUS_COBRANCA = {
  pendente:  { label: 'Pendente',  cls: 'bg-gray-100 text-gray-600',    dotCls: 'bg-gray-400' },
  ativa:     { label: 'Ativa',     cls: 'bg-blue-100 text-blue-700',    dotCls: 'bg-blue-500' },
  paga:      { label: 'Paga',      cls: 'bg-green-100 text-green-700',  dotCls: 'bg-green-500' },
  atrasada:  { label: 'Atrasada',  cls: 'bg-red-100 text-red-700',      dotCls: 'bg-red-500' },
  cancelada: { label: 'Cancelada', cls: 'bg-gray-100 text-gray-400',    dotCls: 'bg-gray-300' },
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
  limite_colaboradores: '',
  data_inicio: new Date().toISOString().substring(0, 10),
  observacoes: '',
}

const emptyCobrancaForm = {
  tipo: 'unica',
  descricao: '',
  valor: '',
  ciclo: 'MONTHLY',
  billing_type: 'UNDEFINED',
  vencimento: '',
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

  // ── Produtos (acesso) ──────────────────────────────────────────────
  const [produtos, setProdutos] = useState([])
  const [colaboradoresAtivos, setColaboradoresAtivos] = useState(0)
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false)
  const [formProduto, setFormProduto] = useState(emptyProdForm)
  const [salvandoProduto, setSalvandoProduto] = useState(false)
  const [erroProduto, setErroProduto] = useState('')

  const [selecionadoProduto, setSelecionadoProduto] = useState(null)
  const [produtoModalAberto, setProdutoModalAberto] = useState(false)
  const [editandoProduto, setEditandoProduto] = useState(false)
  const [salvandoEditProduto, setSalvandoEditProduto] = useState(false)
  const [erroEditProduto, setErroEditProduto] = useState('')
  const [formEditProduto, setFormEditProduto] = useState({ limite_colaboradores: '', data_inicio: '', observacoes: '' })

  // ── Cobranças (financeiro) ─────────────────────────────────────────
  const [cobrancas, setCobrancas] = useState([])
  const [asaasAtivo, setAsaasAtivo] = useState(false)
  const [asaasWarning, setAsaasWarning] = useState('')
  const [novaCobrancaAberta, setNovaCobrancaAberta] = useState(false)
  const [formCobranca, setFormCobranca] = useState(emptyCobrancaForm)
  const [salvandoCobranca, setSalvandoCobranca] = useState(false)
  const [erroCobranca, setErroCobranca] = useState('')

  const [selecionadaCobranca, setSelecionadaCobranca] = useState(null)
  const [cobrancaModalAberta, setCobrancaModalAberta] = useState(false)
  const [editandoCobranca, setEditandoCobranca] = useState(false)
  const [formEditCobranca, setFormEditCobranca] = useState(emptyCobrancaForm)
  const [salvandoEditCobranca, setSalvandoEditCobranca] = useState(false)
  const [erroEditCobranca, setErroEditCobranca] = useState('')
  const [resyncCobrancaId, setResyncCobrancaId] = useState(null)

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
  async function carregarCobrancas() {
    try {
      const res = await plataformaCobrancaService.listar(id)
      setCobrancas(res.data?.cobrancas ?? [])
      setAsaasAtivo(!!res.data?.asaas_ativo)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { carregarProdutos(); carregarCobrancas() }, [id])

  function setFP(k, v) { setFormProduto((f) => ({ ...f, [k]: v })) }
  function setFEP(k, v) { setFormEditProduto((f) => ({ ...f, [k]: v })) }
  function setFC(k, v) { setFormCobranca((f) => ({ ...f, [k]: v })) }
  function setFEC(k, v) { setFormEditCobranca((f) => ({ ...f, [k]: v })) }

  // ── Produtos (acesso) ──────────────────────────────────────────────
  function abrirNovoProdutoModal() {
    const disponiveis = Object.keys(PRODUTOS_CATALOGO).filter((key) => !produtos.some((p) => p.produto === key))
    const prim = disponiveis[0] ?? 'diagnostico_nr1'
    setFormProduto({ ...emptyProdForm, produto: prim })
    setErroProduto('')
    setNovoProdutoAberto(true)
  }

  async function liberarProduto() {
    setSalvandoProduto(true); setErroProduto('')
    try {
      await plataformaProdutoService.contratar(id, {
        produto: formProduto.produto,
        limite_colaboradores: formProduto.limite_colaboradores !== '' ? Number(formProduto.limite_colaboradores) : null,
        data_inicio: formProduto.data_inicio,
        observacoes: formProduto.observacoes || null,
      })
      await carregarProdutos()
      setNovoProdutoAberto(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao liberar acesso.'))
    } finally {
      setSalvandoProduto(false)
    }
  }

  function abrirProdutoModal(produto) {
    setSelecionadoProduto(produto); setProdutoModalAberto(true); setEditandoProduto(false); setErroEditProduto('')
  }
  function fecharProdutoModal() {
    setSelecionadoProduto(null); setProdutoModalAberto(false); setEditandoProduto(false)
  }
  function iniciarEdicaoProduto() {
    setFormEditProduto({
      limite_colaboradores: selecionadoProduto.limite_colaboradores ?? '',
      data_inicio: selecionadoProduto.data_inicio ? selecionadoProduto.data_inicio.substring(0, 10) : '',
      observacoes: selecionadoProduto.observacoes ?? '',
    })
    setEditandoProduto(true); setErroEditProduto('')
  }
  async function salvarEdicaoProduto() {
    setSalvandoEditProduto(true); setErroEditProduto('')
    try {
      await plataformaProdutoService.atualizar(id, selecionadoProduto.id, {
        limite_colaboradores: formEditProduto.limite_colaboradores !== '' ? Number(formEditProduto.limite_colaboradores) : null,
        data_inicio: formEditProduto.data_inicio || undefined,
        observacoes: formEditProduto.observacoes || null,
      })
      await carregarProdutos()
      const res = await plataformaProdutoService.listar(id)
      const fresh = (res.data?.produtos ?? []).find((p) => p.id === selecionadoProduto.id)
      if (fresh) setSelecionadoProduto(fresh); else fecharProdutoModal()
      setEditandoProduto(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroEditProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar.'))
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
    if (!window.confirm(`Remover acesso a "${PRODUTOS_CATALOGO[produto.produto]?.titulo || produto.produto}"?`)) return
    try {
      await plataformaProdutoService.remover(id, produto.id)
      await carregarProdutos(); fecharProdutoModal()
    } catch { alert('Erro ao remover acesso.') }
  }

  // ── Cobranças (financeiro) ─────────────────────────────────────────
  function cobrancaPayload(f) {
    const recorrente = f.tipo === 'recorrente'
    return {
      tipo: f.tipo,
      descricao: f.descricao,
      valor: f.valor !== '' ? Number(f.valor) : null,
      ciclo: recorrente ? (f.ciclo || 'MONTHLY') : null,
      billing_type: f.billing_type || 'UNDEFINED',
      vencimento: f.vencimento || null,
      observacoes: f.observacoes || null,
    }
  }
  function resumoCobranca(c) {
    if (c.tipo === 'recorrente') return `${formatBRL(c.valor)} / ${(CICLOS[c.ciclo] || 'Mensal').toLowerCase()}`
    return `${formatBRL(c.valor)} · única`
  }
  function abrirNovaCobranca() {
    setFormCobranca({ ...emptyCobrancaForm }); setErroCobranca(''); setNovaCobrancaAberta(true)
  }
  async function criarCobranca() {
    setSalvandoCobranca(true); setErroCobranca('')
    try {
      const resp = await plataformaCobrancaService.criar(id, cobrancaPayload(formCobranca))
      setAsaasWarning(resp?.asaas_warning?.mensagem || '')
      await carregarCobrancas()
      setNovaCobrancaAberta(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroCobranca(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao criar cobrança.'))
    } finally {
      setSalvandoCobranca(false)
    }
  }
  function abrirCobrancaModal(c) {
    setSelecionadaCobranca(c); setCobrancaModalAberta(true); setEditandoCobranca(false); setErroEditCobranca('')
  }
  function fecharCobrancaModal() {
    setSelecionadaCobranca(null); setCobrancaModalAberta(false); setEditandoCobranca(false)
  }
  function iniciarEdicaoCobranca() {
    setFormEditCobranca({
      tipo: selecionadaCobranca.tipo ?? 'unica',
      descricao: selecionadaCobranca.descricao ?? '',
      valor: selecionadaCobranca.valor ?? '',
      ciclo: selecionadaCobranca.ciclo ?? 'MONTHLY',
      billing_type: selecionadaCobranca.billing_type ?? 'UNDEFINED',
      vencimento: selecionadaCobranca.vencimento ? selecionadaCobranca.vencimento.substring(0, 10) : '',
      observacoes: selecionadaCobranca.observacoes ?? '',
    })
    setEditandoCobranca(true); setErroEditCobranca('')
  }
  async function salvarEdicaoCobranca() {
    setSalvandoEditCobranca(true); setErroEditCobranca('')
    try {
      const { tipo, ...rest } = cobrancaPayload(formEditCobranca)
      if (formEditCobranca.status) rest.status = formEditCobranca.status
      const resp = await plataformaCobrancaService.atualizar(id, selecionadaCobranca.id, rest)
      setAsaasWarning(resp?.asaas_warning?.mensagem || '')
      await carregarCobrancas()
      const res = await plataformaCobrancaService.listar(id)
      const fresh = (res.data?.cobrancas ?? []).find((c) => c.id === selecionadaCobranca.id)
      if (fresh) setSelecionadaCobranca(fresh); else fecharCobrancaModal()
      setEditandoCobranca(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroEditCobranca(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar cobrança.'))
    } finally {
      setSalvandoEditCobranca(false)
    }
  }
  async function reSincronizarCobranca(c) {
    setResyncCobrancaId(c.id); setAsaasWarning('')
    try {
      await plataformaCobrancaService.sincronizarAsaas(id, c.id)
      await carregarCobrancas()
      const res = await plataformaCobrancaService.listar(id)
      const fresh = (res.data?.cobrancas ?? []).find((x) => x.id === c.id)
      if (fresh) setSelecionadaCobranca(fresh)
    } catch (err) {
      setAsaasWarning(err.response?.data?.message || 'Falha ao re-sincronizar com Asaas.')
    } finally {
      setResyncCobrancaId(null)
    }
  }
  async function removerCobranca(c) {
    if (!window.confirm(`Cancelar e remover a cobrança "${c.descricao}"? Isso também cancela no Asaas.`)) return
    try {
      await plataformaCobrancaService.remover(id, c.id)
      await carregarCobrancas(); fecharCobrancaModal()
    } catch { alert('Erro ao remover cobrança.') }
  }

  // ── Empresa ────────────────────────────────────────────────────────
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

  function camposCobranca(form, setter, comTipo) {
    const recorrente = form.tipo === 'recorrente'
    return (
      <>
        {comTipo && (
          <div>
            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Tipo</label>
            <select value={form.tipo} onChange={(e) => setter('tipo', e.target.value)} className="input-field text-sm">
              <option value="unica">Cobrança única (boleto avulso)</option>
              <option value="recorrente">Recorrente (assinatura)</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Descrição</label>
          <input value={form.descricao} onChange={(e) => setter('descricao', e.target.value)} placeholder="Ex: Diagnóstico NR-1 · setup" className="input-field text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Valor (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setter('valor', e.target.value)} placeholder="Ex: 2000" className="input-field text-sm" />
          </div>
          {recorrente && (
            <div>
              <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Ciclo</label>
              <select value={form.ciclo} onChange={(e) => setter('ciclo', e.target.value)} className="input-field text-sm">
                {Object.entries(CICLOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Forma de pagamento</label>
            <select value={form.billing_type} onChange={(e) => setter('billing_type', e.target.value)} className="input-field text-sm">
              {Object.entries(BILLING_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">{recorrente ? '1º vencimento' : 'Vencimento'}</label>
            <input type="date" value={form.vencimento} onChange={(e) => setter('vencimento', e.target.value)} className="input-field text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Observações</label>
          <textarea rows={2} value={form.observacoes} onChange={(e) => setter('observacoes', e.target.value)} placeholder="Notas internas" className="input-field text-sm resize-none" />
        </div>
      </>
    )
  }

  if (loading) return <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando...</div>
  if (!empresa) return <div className="py-12 text-center text-sm text-red-600">Empresa não encontrada.</div>

  const st = statusStyle[empresa.status] ?? statusStyle.ativo
  const unidades = (empresa.setores ?? []).reduce((acc, s) => {
    const key = s.unidade || 'Geral'; if (!acc[key]) acc[key] = []; acc[key].push(s); return acc
  }, {})
  const totalRecorrente = cobrancas
    .filter((c) => c.tipo === 'recorrente' && ['ativa', 'paga', 'pendente'].includes(c.status))
    .reduce((sum, c) => sum + Number(c.valor ?? 0), 0)
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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {empresa.asaas_customer_id ? (
          <div className="bg-blue-50 border border-blue-100 text-rp-azul text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2">
            <Check size={12} className="text-green-600" />
            <span className="font-semibold">Cliente Asaas:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded text-rp-texto">{empresa.asaas_customer_id}</code>
          </div>
        ) : (
          <div className="bg-gray-50 border border-rp-cinza-borda text-rp-cinza-medio text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Cliente Asaas ainda não criado (criado na 1ª cobrança).
          </div>
        )}
        {!asaasAtivo && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2">
            <AlertTriangle size={12} /> Integração Asaas desativada — cobranças ficam só no sistema.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users,        label: 'Empregados',     value: empresa.colaboradores_count ?? 0, note: `de ${empresa.max_colaboradores ?? '∞'}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Grid,         label: 'Setores',        value: empresa.setores_count ?? 0, color: 'text-rp-azul', bg: 'bg-rp-azul-suave' },
          { icon: Package,      label: 'Produtos (acesso)', value: produtos.length, color: 'text-rp-laranja', bg: 'bg-orange-50' },
          { icon: CreditCard,   label: 'Recorrente/mês', value: formatBRL(totalRecorrente), color: 'text-rp-azul', bg: 'bg-blue-50' },
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
                  ['Recorrente/mês (cobranças)', formatBRL(totalRecorrente)],
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

        {/* Coluna 3: Produtos (acesso) */}
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-rp-azul flex items-center gap-2"><Package size={14} /> Produtos ({produtos.length})</h3>
              <Button variant="outline" size="sm" onClick={abrirNovoProdutoModal}><Plus size={12} /> Liberar</Button>
            </div>
            <p className="text-[11px] text-rp-cinza-medio mb-4">Acesso às funcionalidades. Não gera cobrança.</p>
            {produtos.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                <Package size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                <p className="text-sm text-rp-cinza-medio">Nenhum produto liberado.</p>
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
                        <p className="text-[10px] text-rp-cinza-medio">{sp.label}{p.limite_colaboradores ? ` · limite ${p.limite_colaboradores}` : ''}</p>
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

      {/* Seção: Cobranças (financeiro) */}
      <div className="bg-white rounded-xl p-5 shadow-card mt-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-rp-azul flex items-center gap-2"><Receipt size={15} /> Cobranças ({cobrancas.length})</h3>
          <Button variant="primary" size="sm" onClick={abrirNovaCobranca}><Plus size={12} /> Nova cobrança</Button>
        </div>
        <p className="text-[11px] text-rp-cinza-medio mb-4">Financeiro avulso, atrelado à empresa. Cada recorrente = 1 assinatura = 1 boleto por ciclo.</p>
        {cobrancas.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
            <Receipt size={22} className="mx-auto text-rp-cinza-medio mb-2" />
            <p className="text-sm text-rp-cinza-medio">Nenhuma cobrança criada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide border-b border-rp-cinza-borda">
                  <th className="text-left py-2 px-2">Descrição</th>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-left py-2 px-2">Vencimento</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {cobrancas.map((c) => {
                  const sc = STATUS_COBRANCA[c.status] ?? STATUS_COBRANCA.pendente
                  return (
                    <tr key={c.id} className="border-b border-rp-cinza-borda/60 hover:bg-rp-cinza-claro/40 cursor-pointer" onClick={() => abrirCobrancaModal(c)}>
                      <td className="py-2.5 px-2">
                        <p className="font-semibold text-rp-texto truncate max-w-[220px]">{c.descricao}</p>
                        {c.observacoes && <p className="text-[10px] text-rp-cinza-medio truncate max-w-[220px]">{c.observacoes}</p>}
                      </td>
                      <td className="py-2.5 px-2 text-xs text-rp-cinza-medio">{c.tipo === 'recorrente' ? `Recorrente (${CICLOS[c.ciclo] || 'Mensal'})` : 'Única'}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-rp-texto">{formatBRL(c.valor)}</td>
                      <td className="py-2.5 px-2 text-xs text-rp-cinza-medio">{c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="py-2.5 px-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                      <td className="py-2.5 px-2 text-right">
                        {c.asaas_invoice_url && (
                          <a href={c.asaas_invoice_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-bold text-rp-azul hover:text-rp-laranja"><ExternalLink size={12} /> Fatura</a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Liberar Produto (acesso) */}
      {novoProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex items-center gap-2"><Package className="text-rp-azul" size={18} /><h3 className="font-bold text-rp-azul text-base">Liberar acesso a produto</h3></div>
              <button onClick={() => setNovoProdutoAberto(false)} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {produtosNaoContratados.length === 0 ? (
                <div className="py-8 text-center">
                  <Package size={32} className="mx-auto text-rp-cinza-medio mb-2" />
                  <p className="text-sm font-semibold text-rp-texto">Todos os produtos já foram liberados.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Produto</label>
                    <select value={formProduto.produto} onChange={(e) => setFP('produto', e.target.value)} className="input-field text-sm">
                      {produtosNaoContratados.map(([key, p]) => <option key={key} value={key}>{p.titulo}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Limite de empregados</label>
                      <input type="number" min="1" value={formProduto.limite_colaboradores} onChange={(e) => setFP('limite_colaboradores', e.target.value)} placeholder="Opcional" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de início</label>
                      <input type="date" value={formProduto.data_inicio} onChange={(e) => setFP('data_inicio', e.target.value)} className="input-field text-sm" />
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
              {produtosNaoContratados.length > 0 && <Button variant="primary" size="sm" loading={salvandoProduto} onClick={liberarProduto}>Liberar acesso</Button>}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe/Edição de Produto (acesso) */}
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
                  <div className="bg-rp-cinza-claro/50 rounded-xl p-4 border border-rp-cinza-borda">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Data de Início</span><strong className="text-sm text-rp-texto">{selecionadoProduto.data_inicio ? new Date(selecionadoProduto.data_inicio).toLocaleDateString('pt-BR') : '—'}</strong></div>
                      <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Limite empregados</span><strong className="text-sm text-rp-texto">{selecionadoProduto.limite_colaboradores ?? 'Sem limite'}</strong></div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-1.5">Observações Internas</span>
                    <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-3.5 text-xs text-rp-texto min-h-[50px] whitespace-pre-wrap">
                      {selecionadoProduto.observacoes || <span className="text-rp-cinza-medio italic">Nenhuma observação.</span>}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Limite empregados</label>
                      <input type="number" min="1" value={formEditProduto.limite_colaboradores} onChange={(e) => setFEP('limite_colaboradores', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de Início</label>
                      <input type="date" value={formEditProduto.data_inicio} onChange={(e) => setFEP('data_inicio', e.target.value)} className="input-field text-sm" />
                    </div>
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

      {/* Modal: Nova Cobrança */}
      {novaCobrancaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex items-center gap-2"><Receipt className="text-rp-azul" size={18} /><h3 className="font-bold text-rp-azul text-base">Nova cobrança</h3></div>
              <button onClick={() => setNovaCobrancaAberta(false)} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {camposCobranca(formCobranca, setFC, true)}
              {erroCobranca && <p className="text-xs text-red-600 font-semibold">{erroCobranca}</p>}
            </div>
            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-end gap-2 bg-rp-cinza-claro flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setNovaCobrancaAberta(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" loading={salvandoCobranca} onClick={criarCobranca}>Criar cobrança</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe/Edição de Cobrança */}
      {cobrancaModalAberta && selecionadaCobranca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-rp-azul text-base truncate">{selecionadaCobranca.descricao}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COBRANCA[selecionadaCobranca.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>{STATUS_COBRANCA[selecionadaCobranca.status]?.label ?? selecionadaCobranca.status}</span>
                </div>
                <p className="text-xs text-rp-cinza-medio">{resumoCobranca(selecionadaCobranca)} · {BILLING_TYPES[selecionadaCobranca.billing_type] ?? selecionadaCobranca.billing_type}</p>
              </div>
              <button onClick={fecharCobrancaModal} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500 flex-shrink-0"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!editandoCobranca ? (
                <div className="space-y-5">
                  <div className="bg-rp-cinza-claro/50 rounded-xl p-4 border border-rp-cinza-borda grid grid-cols-2 gap-x-4 gap-y-2">
                    <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Tipo</span><strong className="text-sm text-rp-texto">{selecionadaCobranca.tipo === 'recorrente' ? 'Recorrente' : 'Única'}</strong></div>
                    <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Valor</span><strong className="text-sm text-rp-texto">{formatBRL(selecionadaCobranca.valor)}</strong></div>
                    {selecionadaCobranca.tipo === 'recorrente' && <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Ciclo</span><strong className="text-sm text-rp-texto">{CICLOS[selecionadaCobranca.ciclo] || 'Mensal'}</strong></div>}
                    <div><span className="block text-[10px] text-rp-cinza-medio uppercase">Vencimento</span><strong className="text-sm text-rp-texto">{selecionadaCobranca.vencimento ? new Date(selecionadaCobranca.vencimento).toLocaleDateString('pt-BR') : '—'}</strong></div>
                  </div>

                  {selecionadaCobranca.observacoes && (
                    <div>
                      <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-1.5">Observações</span>
                      <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-3.5 text-xs text-rp-texto whitespace-pre-wrap">{selecionadaCobranca.observacoes}</div>
                    </div>
                  )}

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <h4 className="text-xs font-bold text-rp-azul uppercase tracking-wider mb-2">Integração Asaas</h4>
                    <div className="bg-rp-cinza-claro/50 border border-rp-cinza-borda rounded-xl p-4 flex flex-col gap-3">
                      {(selecionadaCobranca.asaas_subscription_id || selecionadaCobranca.asaas_payment_id) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-green-700"><span className="w-2 h-2 rounded-full bg-green-500" /> Sincronizada com Asaas</div>
                          <div className="text-xs space-y-1 bg-white border border-rp-cinza-borda rounded-lg p-2.5 font-mono text-rp-texto">
                            {selecionadaCobranca.asaas_subscription_id && <div><span className="text-rp-cinza-medio">Assinatura:</span> {selecionadaCobranca.asaas_subscription_id}</div>}
                            {selecionadaCobranca.asaas_payment_id && <div><span className="text-rp-cinza-medio">Cobrança:</span> {selecionadaCobranca.asaas_payment_id}</div>}
                          </div>
                          {selecionadaCobranca.asaas_invoice_url && (
                            <a href={selecionadaCobranca.asaas_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-rp-azul hover:text-rp-laranja"><ExternalLink size={13} /> Abrir Fatura no Asaas</a>
                          )}
                          <button onClick={() => reSincronizarCobranca(selecionadaCobranca)} disabled={resyncCobrancaId === selecionadaCobranca.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rp-azul-suave border border-rp-cinza-borda rounded-lg text-xs font-bold text-rp-azul disabled:opacity-50 w-fit">
                            <RefreshCw size={12} className={resyncCobrancaId === selecionadaCobranca.id ? 'animate-spin' : ''} />
                            {resyncCobrancaId === selecionadaCobranca.id ? 'Sincronizando...' : 'Re-sincronizar'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Não sincronizada</div>
                          <button onClick={() => reSincronizarCobranca(selecionadaCobranca)} disabled={resyncCobrancaId === selecionadaCobranca.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rp-azul-suave border border-rp-cinza-borda rounded-lg text-xs font-bold text-rp-azul disabled:opacity-50 w-fit">
                            <RefreshCw size={12} className={resyncCobrancaId === selecionadaCobranca.id ? 'animate-spin' : ''} />
                            {resyncCobrancaId === selecionadaCobranca.id ? 'Sincronizando...' : 'Sincronizar agora'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-2.5">Ações</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={removerCobranca.bind(null, selecionadaCobranca)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-600 rounded-xl ml-auto">Cancelar cobrança</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {camposCobranca(formEditCobranca, setFEC, false)}
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Status</label>
                    <select value={formEditCobranca.status ?? selecionadaCobranca.status} onChange={(e) => setFEC('status', e.target.value)} className="input-field text-sm">
                      {Object.entries(STATUS_COBRANCA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {erroEditCobranca && <p className="text-xs text-red-600 font-semibold">{erroEditCobranca}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              {!editandoCobranca ? (
                <>
                  <Button variant="outline" size="sm" onClick={fecharCobrancaModal}>Fechar</Button>
                  <Button variant="primary" size="sm" onClick={iniciarEdicaoCobranca}><Edit2 size={13} className="mr-1 inline" /> Editar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditandoCobranca(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" loading={salvandoEditCobranca} onClick={salvarEdicaoCobranca}>Salvar Alterações</Button>
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
