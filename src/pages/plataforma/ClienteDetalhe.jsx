import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Grid, ClipboardList, Edit2, Check, AlertTriangle, Package, Plus, X, DollarSign, ExternalLink, RefreshCw, CreditCard, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService, plataformaProdutoService } from '../../services/plataformaService'
import { formatDate } from '../../utils/formatters'

const PRODUTOS_CATALOGO = {
  mapa_riscos:     { titulo: 'Mapa de Riscos',              tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  pesquisas:       { titulo: 'Pesquisas e Clima',           tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  checkins:        { titulo: 'Check-ins Semanais',          tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  diagnostico_nr1: { titulo: 'Diagnóstico Psicossocial NR-1', tipoSugerido: 'pontual',           sub: 'R$/empregado · 2 aplicações/ano' },
  plano_acao_nr1:  { titulo: 'Plano de Ação Continuado NR-1', tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  canal_escuta:    { titulo: 'Canal de Escuta Profissional',  tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente · headcount' },
  feedback:        { titulo: 'Feedback 360',                tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  pdi:             { titulo: 'Plano de Desenvolvimento (PDI)', tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
}

const STATUS_PRODUTO = {
  ativo:        { label: 'Ativo',        cls: 'bg-green-100 text-green-700', dotCls: 'bg-green-500' },
  pausado:      { label: 'Pausado',      cls: 'bg-yellow-100 text-yellow-700', dotCls: 'bg-yellow-500' },
  encerrado:    { label: 'Encerrado',    cls: 'bg-gray-100 text-gray-500', dotCls: 'bg-gray-400' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700', dotCls: 'bg-red-500' },
}

function formatBRL(v) {
  if (v === null || v === undefined || v === '') return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
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

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ plano: '', max_colaboradores: '', valor_mensal: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [removerModalAberto, setRemoverModalAberto] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  const [produtos, setProdutos] = useState([])
  const [colaboradoresAtivos, setColaboradoresAtivos] = useState(0)
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false)
  const [formProduto, setFormProduto] = useState({
    produto: 'diagnostico_nr1',
    tipo: 'pontual',
    valor_unitario: '30',
    valor_mensal: '',
    quantidade_aplicacoes: '2',
    limite_colaboradores: '50',
    data_inicio: new Date().toISOString().substring(0, 10),
    numero_contrato: '',
    observacoes: '',
  })
  const [salvandoProduto, setSalvandoProduto] = useState(false)
  const [erroProduto, setErroProduto] = useState('')
  const [asaasWarning, setAsaasWarning] = useState('')
  const [resyncingId, setResyncingId] = useState(null)

  // Estados do Modal de Detalhes e Edição de Produto
  const [selecionadoProduto, setSelecionadoProduto] = useState(null)
  const [produtoModalAberto, setProdutoModalAberto] = useState(false)
  const [editandoProduto, setEditandoProduto] = useState(false)
  const [salvandoEditProduto, setSalvandoEditProduto] = useState(false)
  const [erroEditProduto, setErroEditProduto] = useState('')
  const [formEditProduto, setFormEditProduto] = useState({
    tipo: '',
    valor_unitario: '',
    valor_mensal: '',
    quantidade_aplicacoes: '',
    limite_colaboradores: '',
    data_inicio: '',
    numero_contrato: '',
    observacoes: '',
  })

  function abrirProdutoModal(produto) {
    setSelecionadoProduto(produto)
    setProdutoModalAberto(true)
    setEditandoProduto(false)
    setErroEditProduto('')
  }

  function fecharProdutoModal() {
    setSelecionadoProduto(null)
    setProdutoModalAberto(false)
    setEditandoProduto(false)
  }

  function iniciarEdicaoProduto() {
    setFormEditProduto({
      tipo: selecionadoProduto.tipo ?? '',
      valor_unitario: selecionadoProduto.valor_unitario ?? '',
      valor_mensal: selecionadoProduto.valor_mensal ?? '',
      quantidade_aplicacoes: selecionadoProduto.quantidade_aplicacoes ?? '',
      limite_colaboradores: selecionadoProduto.limite_colaboradores ?? '',
      data_inicio: selecionadoProduto.data_inicio ? selecionadoProduto.data_inicio.substring(0, 10) : '',
      numero_contrato: selecionadoProduto.numero_contrato ?? '',
      observacoes: selecionadoProduto.observacoes ?? '',
    })
    setEditandoProduto(true)
    setErroEditProduto('')
  }

  function setFEP(k, v) {
    setFormEditProduto(f => {
      const next = { ...f, [k]: v }
      if (selecionadoProduto?.tipo === 'recorrente_mensal' || next.tipo === 'recorrente_mensal') {
        if (k === 'limite_colaboradores' || k === 'valor_unitario' || k === 'tipo') {
          const limit = Number(next.limite_colaboradores) || 0
          const unit = Number(next.valor_unitario) || 0
          if (limit && unit) {
            next.valor_mensal = String(limit * unit)
          }
        }
      }
      return next
    })
  }

  async function salvarEdicaoProduto() {
    setSalvandoEditProduto(true)
    setErroEditProduto('')
    try {
      const payload = {
        tipo:                  empresa.valor_mensal !== null ? selecionadoProduto.tipo : (formEditProduto.tipo || null),
        valor_unitario:        empresa.valor_mensal !== null ? null : (formEditProduto.valor_unitario ? Number(formEditProduto.valor_unitario) : null),
        valor_mensal:          empresa.valor_mensal !== null ? null : (formEditProduto.valor_mensal ? Number(formEditProduto.valor_mensal) : null),
        quantidade_aplicacoes: empresa.valor_mensal !== null ? null : (formEditProduto.quantidade_aplicacoes ? Number(formEditProduto.quantidade_aplicacoes) : null),
        limite_colaboradores:  formEditProduto.limite_colaboradores ? Number(formEditProduto.limite_colaboradores) : null,
        data_inicio:           formEditProduto.data_inicio || null,
        numero_contrato:       formEditProduto.numero_contrato || null,
        observacoes:           formEditProduto.observacoes || null,
      }
      await plataformaProdutoService.atualizar(id, selecionadoProduto.id, payload)
      await carregarProdutos()
      
      // Carrega produtos recém-atualizados para manter o modal aberto com valores atualizados
      const res = await plataformaProdutoService.listar(id)
      const freshProd = (res.data?.produtos ?? []).find(p => p.id === selecionadoProduto.id)
      if (freshProd) {
        setSelecionadoProduto(freshProd)
      } else {
        fecharProdutoModal()
      }
      
      setEditandoProduto(false)
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroEditProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar alterações.'))
    } finally {
      setSalvandoEditProduto(false)
    }
  }

  useEffect(() => {
    plataformaEmpresaService.buscar(id)
      .then(setEmpresa)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function carregarProdutos() {
    try {
      const res = await plataformaProdutoService.listar(id)
      setProdutos(res.data?.produtos ?? [])
      setColaboradoresAtivos(res.data?.colaboradores_ativos ?? 0)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { carregarProdutos() }, [id])

  function setFP(k, v) {
    setFormProduto(f => {
      const next = { ...f, [k]: v }
      // Auto-ajusta o tipo conforme produto selecionado
      if (k === 'produto') {
        next.tipo = PRODUTOS_CATALOGO[v]?.tipoSugerido ?? 'pontual'
        if (v === 'diagnostico_nr1') {
          next.valor_unitario = '30'
          next.quantidade_aplicacoes = '2'
          next.valor_mensal = ''
          next.limite_colaboradores = '50'
        } else {
          next.valor_unitario = '30'
          next.quantidade_aplicacoes = ''
          next.limite_colaboradores = '50'
          next.valor_mensal = '1500'
        }
      }
      // Auto-calculo do valor mensal se for recorrente
      if (next.tipo === 'recorrente_mensal') {
        if (k === 'limite_colaboradores' || k === 'valor_unitario' || k === 'tipo' || k === 'produto') {
          const limit = Number(next.limite_colaboradores) || 0
          const unit = Number(next.valor_unitario) || 0
          if (limit && unit) {
            next.valor_mensal = String(limit * unit)
          }
        }
      }
      return next
    })
  }

  async function contratarProduto() {
    setSalvandoProduto(true); setErroProduto('')
    try {
      const payload = {
        produto:               formProduto.produto,
        tipo:                  empresa.valor_mensal !== null ? (PRODUTOS_CATALOGO[formProduto.produto]?.tipoSugerido ?? 'recorrente_mensal') : formProduto.tipo,
        valor_unitario:        empresa.valor_mensal !== null ? null : (formProduto.valor_unitario ? Number(formProduto.valor_unitario) : null),
        valor_mensal:          empresa.valor_mensal !== null ? null : (formProduto.valor_mensal   ? Number(formProduto.valor_mensal)   : null),
        quantidade_aplicacoes: empresa.valor_mensal !== null ? null : (formProduto.quantidade_aplicacoes ? Number(formProduto.quantidade_aplicacoes) : null),
        limite_colaboradores:  formProduto.limite_colaboradores  ? Number(formProduto.limite_colaboradores)  : null,
        data_inicio:           formProduto.data_inicio,
        numero_contrato:       formProduto.numero_contrato || null,
        observacoes:           formProduto.observacoes     || null,
      }
      const resp = await plataformaProdutoService.contratar(id, payload)
      if (resp?.asaas_warning?.mensagem) {
        setAsaasWarning(resp.asaas_warning.mensagem)
      } else {
        setAsaasWarning('')
      }
      await carregarProdutos()
      setNovoProdutoAberto(false)
      setErroProduto('')
    } catch (err) {
      const msgs = err.response?.data?.errors ? Object.values(err.response.data.errors).flat() : null
      setErroProduto(msgs ? msgs[0] : (err.response?.data?.message || 'Erro ao salvar contrato.'))
    } finally {
      setSalvandoProduto(false)
    }
  }

  async function alterarStatusProduto(produto, novoStatus) {
    try {
      await plataformaProdutoService.atualizar(id, produto.id, { status: novoStatus })
      await carregarProdutos()
    } catch { alert('Erro ao alterar status.') }
  }

  async function removerProduto(produto) {
    if (!window.confirm(`Remover contrato de "${PRODUTOS_CATALOGO[produto.produto]?.titulo || produto.titulo || produto.produto}"? Esta ação não pode ser desfeita.`)) return
    try {
      await plataformaProdutoService.remover(id, produto.id)
      await carregarProdutos()
    } catch { alert('Erro ao remover contrato.') }
  }

  async function reSincronizarAsaas(produto) {
    setResyncingId(produto.id)
    setAsaasWarning('')
    try {
      await plataformaProdutoService.sincronizarAsaas(id, produto.id)
      await carregarProdutos()
    } catch (err) {
      const msg = err.response?.data?.message || 'Falha ao re-sincronizar com Asaas.'
      setAsaasWarning(msg)
    } finally {
      setResyncingId(null)
    }
  }

  function startEdit() {
    setEditForm({ plano: empresa.plano, max_colaboradores: empresa.max_colaboradores ?? '', valor_mensal: empresa.valor_mensal ?? '' })
    setEditMode(true)
  }

  async function saveEdit() {
    setSaving(true)
    setError('')
    try {
      const updated = await plataformaEmpresaService.atualizar(id, {
        plano: editForm.plano,
        max_colaboradores: editForm.max_colaboradores ? Number(editForm.max_colaboradores) : undefined,
        valor_mensal: editForm.valor_mensal !== '' ? Number(editForm.valor_mensal) : null,
      })
      setEmpresa((prev) => ({ ...prev, ...updated }))
      setEditMode(false)
    } catch {
      setError('Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus() {
    const novoStatus = empresa.status === 'ativo' ? 'suspenso' : 'ativo'
    setError('')
    try {
      const updated = await plataformaEmpresaService.atualizar(id, { status: novoStatus })
      setEmpresa((prev) => ({ ...prev, status: updated.status }))
    } catch {
      setError('Erro ao atualizar status.')
    }
  }

  async function confirmarRemocao() {
    setRemovendo(true)
    setError('')
    try {
      await plataformaEmpresaService.cancelar(id)
      navigate('/plataforma/clientes')
    } catch {
      setError('Erro ao excluir o cliente.')
      setRemoverModalAberto(false)
    } finally {
      setRemovendo(false)
    }
  }

  function abrirNovoProdutoModal() {
    const disponiveis = Object.keys(PRODUTOS_CATALOGO).filter(
      key => !produtos.some(p => p.produto === key)
    )
    if (disponiveis.length > 0) {
      const prim = disponiveis[0]
      setFormProduto({
        produto: prim,
        tipo: PRODUTOS_CATALOGO[prim]?.tipoSugerido ?? 'pontual',
        valor_unitario: '30',
        valor_mensal: prim === 'diagnostico_nr1' ? '' : '1500',
        quantidade_aplicacoes: prim === 'diagnostico_nr1' ? '2' : '',
        limite_colaboradores: '50',
        data_inicio: new Date().toISOString().substring(0, 10),
        numero_contrato: '',
        observacoes: '',
      })
    }
    setNovoProdutoAberto(true)
    setErroProduto('')
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando...</div>
  }
  if (!empresa) {
    return <div className="py-12 text-center text-sm text-red-600">Empresa não encontrada.</div>
  }

  const st = statusStyle[empresa.status] ?? statusStyle.ativo

  const unidades = (empresa.setores ?? []).reduce((acc, s) => {
    const key = s.unidade || 'Geral'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const totalMensal = empresa.valor_mensal !== null && empresa.valor_mensal !== undefined
    ? Number(empresa.valor_mensal)
    : produtos
        .filter(p => p.status === 'ativo' && p.tipo === 'recorrente_mensal')
        .reduce((sum, p) => sum + Number(p.valor_mensal ?? 0), 0)

  const produtosNaoContratados = Object.entries(PRODUTOS_CATALOGO).filter(
    ([key]) => !produtos.some(p => p.produto === key)
  )

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/plataforma/clientes')}
          className="p-2 rounded-lg hover:bg-white border border-rp-cinza-borda text-rp-cinza-medio transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-rp-azul truncate">{empresa.nome_fantasia}</h1>
          {empresa.razao_social && (
            <p className="text-sm text-rp-cinza-medio">{empresa.razao_social}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${planoStyle[empresa.plano] ?? planoStyle.free}`}>
            {empresa.plano}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.badge}`}>
            {st.label}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}
      {asaasWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">{asaasWarning}</div>
          <button onClick={() => setAsaasWarning('')} className="text-yellow-700 hover:text-yellow-900">
            <X size={14} />
          </button>
        </div>
      )}
      {empresa.asaas_customer_id && (
        <div className="bg-blue-50 border border-blue-100 text-rp-azul text-xs px-3 py-2 rounded-lg mb-4 inline-flex items-center gap-2">
          <Check size={12} className="text-green-600" />
          <span className="font-semibold">Cliente Asaas:</span>
          <code className="font-mono bg-white px-2 py-0.5 rounded text-rp-texto">{empresa.asaas_customer_id}</code>
          {empresa.asaas_sincronizado_em && (
            <span className="text-rp-cinza-medio">· sincronizado em {new Date(empresa.asaas_sincronizado_em).toLocaleDateString('pt-BR')}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users,        label: 'Empregados', value: empresa.colaboradores_count ?? 0, note: `de ${empresa.max_colaboradores ?? '∞'}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Grid,         label: 'Setores',       value: empresa.setores_count       ?? 0, color: 'text-rp-azul',    bg: 'bg-rp-azul-suave' },
          { icon: ClipboardList,label: 'Pesquisas',     value: empresa.pesquisas_count     ?? 0, color: 'text-rp-laranja', bg: 'bg-orange-50' },
          { icon: CreditCard,   label: 'Mensalidade Total', value: formatBRL(totalMensal), color: 'text-rp-azul', bg: 'bg-blue-50' },
        ].map(({ icon: Icon, label, value, note, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-rp-azul">{value}</p>
            <p className="text-xs text-rp-cinza-medio mt-0.5">{label}</p>
            {note && <p className="text-[10px] text-rp-cinza-medio">{note}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Dados da Empresa + Ações */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rp-azul">Dados da empresa</h3>
              {!editMode && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 text-xs text-rp-cinza-medio hover:text-rp-azul transition-colors"
                >
                  <Edit2 size={12} /> Editar
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rp-texto mb-2">Plano</label>
                  <div className="grid grid-cols-2 gap-2">
                    {planos.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, plano: p }))}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          editForm.plano === p
                            ? 'border-rp-azul bg-rp-azul-suave'
                            : 'border-rp-cinza-borda hover:border-rp-azul/40'
                        }`}
                      >
                        <span className={`text-sm font-semibold capitalize ${editForm.plano === p ? 'text-rp-azul' : 'text-rp-texto'}`}>
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rp-texto mb-1.5">Limite de empregados</label>
                    <input
                      type="number"
                      value={editForm.max_colaboradores}
                      onChange={(e) => setEditForm((f) => ({ ...f, max_colaboradores: e.target.value }))}
                      className="input-field"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rp-texto mb-1.5">Mensalidade (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.valor_mensal}
                      onChange={(e) => setEditForm((f) => ({ ...f, valor_mensal: e.target.value }))}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" loading={saving} onClick={saveEdit}>Salvar</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {[
                  ['CNPJ',                   empresa.cnpj              || '—'],
                  ['E-mail de contato',       empresa.email_contato     || '—'],
                  ['Telefone',                empresa.telefone          || '—'],
                  ['Limite de empregados', empresa.max_colaboradores ?? '—'],
                  ['Mensalidade negociada',   empresa.valor_mensal !== null ? formatBRL(empresa.valor_mensal) : 'Por produto (legado)'],
                  ['Cliente desde',           formatDate(empresa.created_at)],
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
                {empresa.status === 'ativo' ? (
                  <><AlertTriangle size={14} /> Suspender acesso</>
                ) : (
                  <><Check size={14} /> Reativar acesso</>
                )}
              </Button>
            )}

            <Button 
              variant="danger" 
              fullWidth 
              onClick={() => setRemoverModalAberto(true)}
              className="bg-rp-critico text-white hover:bg-red-700 font-semibold font-bold"
            >
              <Trash2 size={14} /> Excluir Cliente
            </Button>
          </div>
        </div>

        {/* Coluna 2: Usuários + Setores */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-bold text-rp-azul mb-4">
              Usuários ({empresa.users?.length ?? 0})
            </h3>
            <div className="space-y-3">
              {(empresa.users ?? []).map((u) => (
                <div key={u.id} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#003366' }}
                  >
                    {u.nome?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rp-texto truncate">{u.nome}</p>
                    <p className="text-xs text-rp-cinza-medio truncate">{u.email}</p>
                    <span className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide">
                      {perfilLabel[u.perfil] ?? u.perfil}
                    </span>
                  </div>
                </div>
              ))}
              {(empresa.users ?? []).length === 0 && (
                <p className="text-xs text-rp-cinza-medio text-center py-2">Nenhum usuário.</p>
              )}
            </div>
          </div>

          {Object.keys(unidades).length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-bold text-rp-azul mb-4">
                Setores ({empresa.setores_count ?? 0})
              </h3>
              <div className="space-y-4">
                {Object.entries(unidades).map(([unidade, setores]) => (
                  <div key={unidade}>
                    <p className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">
                      {unidade}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {setores.map((s) => (
                        <span key={s.id} className="text-xs bg-rp-cinza-claro text-rp-texto px-2.5 py-1 rounded-lg">
                          {s.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3: Produtos contratados */}
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rp-azul flex items-center gap-2">
                <Package size={14} />
                Produtos contratados ({produtos.length})
              </h3>
              <Button variant="outline" size="sm" onClick={abrirNovoProdutoModal}>
                <Plus size={12} /> Novo produto
              </Button>
            </div>

            {produtos.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                <Package size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                <p className="text-sm text-rp-cinza-medio">Nenhum produto contratado.</p>
                <p className="text-xs text-rp-cinza-medio">Use "Novo produto" para registrar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {produtos.map(p => {
                    const st = STATUS_PRODUTO[p.status] ?? STATUS_PRODUTO.ativo
                    return (
                      <button
                        key={p.id}
                        onClick={() => abrirProdutoModal(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-rp-cinza-claro hover:bg-rp-azul-suave hover:text-rp-azul border border-rp-cinza-borda hover:border-rp-azul/30 rounded-xl text-xs font-semibold text-rp-texto hover:shadow-sm transition-all duration-200"
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dotCls}`} />
                        <span>{PRODUTOS_CATALOGO[p.produto]?.titulo || p.titulo || p.produto}</span>
                        <span className="text-[10px] text-rp-cinza-medio font-normal">
                          ({empresa.valor_mensal !== null ? 'Incluso' : (p.tipo === 'pontual' ? 'Pontual' : formatBRL(p.valor_mensal))})
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-rp-cinza-borda text-[11px] text-rp-cinza-medio flex flex-col gap-1">
                  <div>
                    <span>Empregados cadastrados: <strong className="text-rp-azul">{colaboradoresAtivos}</strong> ativos</span>
                  </div>
                  {empresa.max_colaboradores && (
                    <div>Limite geral da plataforma: <strong className="text-rp-azul">{empresa.max_colaboradores}</strong> empregados</div>
                  )}
                  {(() => {
                    const prodNr1 = produtos.find(p => p.produto === 'diagnostico_nr1' && p.status === 'ativo');
                    if (prodNr1 && prodNr1.limite_colaboradores) {
                      return (
                        <div>Limite do Diagnóstico NR-1: <strong className="text-rp-laranja">{prodNr1.limite_colaboradores}</strong> empregados</div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Novo Produto Modal Popup */}
      {novoProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex items-center gap-2">
                <Package className="text-rp-azul" size={18} />
                <h3 className="font-bold text-rp-azul text-base">Novo Produto</h3>
              </div>
              <button onClick={() => setNovoProdutoAberto(false)} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500 hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {produtosNaoContratados.length === 0 ? (
                <div className="py-8 text-center">
                  <Package size={32} className="mx-auto text-rp-cinza-medio mb-2" />
                  <p className="text-sm font-semibold text-rp-texto">Todos os produtos já foram habilitados</p>
                  <p className="text-xs text-rp-cinza-medio mt-1">Este cliente já possui todos os produtos do catálogo contratados.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Produto</label>
                    <select value={formProduto.produto} onChange={e => setFP('produto', e.target.value)} className="input-field text-sm">
                      {produtosNaoContratados.map(([key, p]) => (
                        <option key={key} value={key}>{p.titulo}</option>
                      ))}
                    </select>
                  </div>

              {empresa.valor_mensal === null && (
                <div>
                  <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Tipo de Cobrança</label>
                  <select value={formProduto.tipo} onChange={e => setFP('tipo', e.target.value)} className="input-field text-sm">
                    <option value="pontual">Cobrança Única (Pontual)</option>
                    <option value="recorrente_mensal">Cobrança Mensal (Recorrente)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">
                    {empresa.valor_mensal !== null ? 'Qtd. Máxima de Testes' : 'Pacote de Empregados'}
                  </label>
                  <select
                    value={['10', '20', '50', '100', '300', '500'].includes(String(formProduto.limite_colaboradores)) ? String(formProduto.limite_colaboradores) : 'custom'}
                    onChange={e => {
                      const val = e.target.value
                      if (val === 'custom') {
                        setFP('limite_colaboradores', '150')
                      } else {
                        setFP('limite_colaboradores', val)
                      }
                    }}
                    className="input-field text-sm"
                  >
                    <option value="10">📦 10 testes/empregados</option>
                    <option value="20">📦 20 testes/empregados</option>
                    <option value="50">📦 50 testes/empregados</option>
                    <option value="100">📦 100 testes/empregados</option>
                    <option value="300">📦 300 testes/empregados</option>
                    <option value="500">📦 500 testes/empregados</option>
                    <option value="custom">✍️ Personalizado...</option>
                  </select>
                </div>
                {!['10', '20', '50', '100', '300', '500'].includes(String(formProduto.limite_colaboradores)) && (
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Qtd. de Testes</label>
                    <input
                      type="number"
                      min="1"
                      value={formProduto.limite_colaboradores || ''}
                      onChange={e => setFP('limite_colaboradores', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                )}
              </div>

              {empresa.valor_mensal === null && (
                <>
                  {formProduto.tipo === 'pontual' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por empregado (R$)</label>
                        <input type="number" step="0.01" value={formProduto.valor_unitario} onChange={e => setFP('valor_unitario', e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Aplicações/ano</label>
                        <input type="number" min="1" max="12" value={formProduto.quantidade_aplicacoes} onChange={e => setFP('quantidade_aplicacoes', e.target.value)} className="input-field text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por empregado (R$)</label>
                        <input type="number" step="0.01" value={formProduto.valor_unitario} onChange={e => setFP('valor_unitario', e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor mensal (R$)</label>
                        <input type="number" step="0.01" value={formProduto.valor_mensal} onChange={e => setFP('valor_mensal', e.target.value)} placeholder="Auto-calculado ou override" className="input-field text-sm" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Data de início</label>
                  <input type="date" value={formProduto.data_inicio} onChange={e => setFP('data_inicio', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Nº do Contrato</label>
                  <input value="Gerado automaticamente..." disabled className="input-field text-sm bg-rp-cinza-claro text-rp-cinza-medio cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Observações</label>
                <textarea rows={3} value={formProduto.observacoes} onChange={e => setFP('observacoes', e.target.value)} placeholder="Notas internas (não visíveis ao cliente)" className="input-field text-sm resize-none" />
              </div>

              {erroProduto && <p className="text-xs text-red-600 font-semibold">{erroProduto}</p>}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-end gap-2 bg-rp-cinza-claro flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setNovoProdutoAberto(false)}>Cancelar</Button>
              {produtosNaoContratados.length > 0 && (
                <Button variant="primary" size="sm" loading={salvandoProduto} onClick={contratarProduto}>Habilitar produto</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visualização/Edição Produto Modal Popup */}
      {produtoModalAberto && selecionadoProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-rp-cinza-borda flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-rp-azul text-base truncate">
                    {PRODUTOS_CATALOGO[selecionadoProduto.produto]?.titulo || selecionadoProduto.titulo || selecionadoProduto.produto}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PRODUTO[selecionadoProduto.status]?.cls ?? 'bg-green-100 text-green-700'}`}>
                    {STATUS_PRODUTO[selecionadoProduto.status]?.label ?? selecionadoProduto.status}
                  </span>
                  <span className="text-[10px] text-rp-cinza-medio bg-white border border-rp-cinza-borda px-2 py-0.5 rounded font-medium">
                    {selecionadoProduto.tipo === 'pontual' ? 'Pontual' : 'Mensal'}
                  </span>
                </div>
                <p className="text-xs text-rp-cinza-medio">ID do Contrato: <span className="font-mono">{selecionadoProduto.id}</span></p>
              </div>
              <button onClick={fecharProdutoModal} className="p-1 rounded-lg text-rp-cinza-medio hover:text-red-500 hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!editandoProduto ? (
                <div className="space-y-5">
                  <div className="bg-rp-cinza-claro/50 rounded-xl p-4 border border-rp-cinza-borda space-y-3">
                    <h4 className="text-xs font-bold text-rp-azul uppercase tracking-wider mb-1">Valores e Condições</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {empresa.valor_mensal !== null ? (
                        <div className="col-span-2 bg-rp-azul-suave/30 p-3 rounded-xl border border-rp-azul/10 mb-2">
                          <span className="block text-[10px] text-rp-azul uppercase font-semibold mb-0.5">Regime de Mensalidade Unificada</span>
                          <span className="text-xs text-rp-texto font-medium">Este produto está incluso na mensalidade contratual de <strong>{formatBRL(empresa.valor_mensal)}</strong>.</span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[10px] text-rp-cinza-medio uppercase">Valor por Empregado</span>
                          <strong className="text-sm text-rp-texto">{formatBRL(selecionadoProduto.valor_unitario)}/colab</strong>
                        </div>
                      )}
                      
                      <div>
                        <span className="block text-[10px] text-rp-cinza-medio uppercase">Limite de Testes</span>
                        <strong className="text-sm text-rp-texto">
                          {selecionadoProduto.limite_colaboradores ? `${selecionadoProduto.limite_colaboradores} testes` : '—'}
                        </strong>
                      </div>
                      
                      {empresa.valor_mensal === null && (
                        <>
                          {selecionadoProduto.tipo === 'pontual' ? (
                            <>
                              <div>
                                <span className="block text-[10px] text-rp-cinza-medio uppercase">Aplicações/ano</span>
                                <strong className="text-sm text-rp-texto">{selecionadoProduto.quantidade_aplicacoes ?? 1}</strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-rp-cinza-medio uppercase">Valor Único Cobrado</span>
                                <strong className="text-sm text-rp-texto">
                                  {formatBRL(
                                    (selecionadoProduto.valor_unitario ?? 0) *
                                    (selecionadoProduto.limite_colaboradores ?? 0) *
                                    (selecionadoProduto.quantidade_aplicacoes ?? 1)
                                  )}
                                </strong>
                              </div>
                            </>
                          ) : (
                            <div>
                              <span className="block text-[10px] text-rp-cinza-medio uppercase">Valor Mensal</span>
                              <strong className="text-sm text-rp-texto">{formatBRL(selecionadoProduto.valor_mensal)}/mês</strong>
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <span className="block text-[10px] text-rp-cinza-medio uppercase">Data de Início</span>
                        <strong className="text-sm text-rp-texto">
                          {selecionadoProduto.data_inicio ? new Date(selecionadoProduto.data_inicio).toLocaleDateString('pt-BR') : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-rp-cinza-medio uppercase">Nº do Contrato</span>
                        <strong className="text-sm text-rp-texto">{selecionadoProduto.numero_contrato ?? '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-1.5">Observações Internas</span>
                    <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-3.5 text-xs text-rp-texto min-h-[60px] whitespace-pre-wrap">
                      {selecionadoProduto.observacoes || <span className="text-rp-cinza-medio italic">Nenhuma observação registrada.</span>}
                    </div>
                  </div>

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <h4 className="text-xs font-bold text-rp-azul uppercase tracking-wider mb-2">Integração Asaas</h4>
                    <div className="bg-rp-cinza-claro/50 border border-rp-cinza-borda rounded-xl p-4 flex flex-col gap-3">
                      {selecionadoProduto.asaas_subscription_id || selecionadoProduto.asaas_payment_id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Sincronizado com Asaas</span>
                          </div>
                          <div className="text-xs space-y-1 bg-white border border-rp-cinza-borda rounded-lg p-2.5 font-mono text-rp-texto">
                            {selecionadoProduto.asaas_subscription_id && (
                              <div><span className="text-rp-cinza-medio">Assinatura ID:</span> {selecionadoProduto.asaas_subscription_id}</div>
                            )}
                            {selecionadoProduto.asaas_payment_id && !selecionadoProduto.asaas_subscription_id && (
                              <div><span className="text-rp-cinza-medio">Cobrança ID:</span> {selecionadoProduto.asaas_payment_id}</div>
                            )}
                          </div>
                          {selecionadoProduto.asaas_invoice_url && (
                            <a
                              href={selecionadoProduto.asaas_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-rp-azul hover:text-rp-laranja transition-colors"
                            >
                              <ExternalLink size={13} /> Abrir Fatura no Asaas
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span>Não sincronizado com Asaas</span>
                          </div>
                          <p className="text-[11px] text-rp-cinza-medio">Este contrato foi criado offline ou a integração com Asaas falhou.</p>
                          <button
                            onClick={() => reSincronizarAsaas(selecionadoProduto).then(() => {
                              plataformaProdutoService.listar(id).then(res => {
                                const fresh = (res.data?.produtos ?? []).find(p => p.id === selecionadoProduto.id)
                                if (fresh) setSelecionadoProduto(fresh)
                              })
                            })}
                            disabled={resyncingId === selecionadoProduto.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rp-azul-suave border border-rp-cinza-borda hover:border-rp-azul/30 rounded-lg text-xs font-bold text-rp-azul disabled:opacity-50 transition-all shadow-sm"
                          >
                            <RefreshCw size={12} className={resyncingId === selecionadoProduto.id ? 'animate-spin' : ''} />
                            {resyncingId === selecionadoProduto.id ? 'Sincronizando...' : 'Sincronizar Agora'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-rp-cinza-borda pt-4">
                    <span className="block text-xs font-bold text-rp-azul uppercase tracking-wider mb-2.5">Ações Administrativas</span>
                    <div className="flex flex-wrap gap-2">
                      {selecionadoProduto.status === 'ativo' && (
                        <button
                          onClick={() => alterarStatusProduto(selecionadoProduto, 'pausado').then(() => {
                            setSelecionadoProduto(p => ({ ...p, status: 'pausado' }))
                          })}
                          className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-xs font-semibold text-yellow-700 rounded-xl transition-all"
                        >
                          Pausar Contrato
                        </button>
                      )}
                      {selecionadoProduto.status === 'pausado' && (
                        <button
                          onClick={() => alterarStatusProduto(selecionadoProduto, 'ativo').then(() => {
                            setSelecionadoProduto(p => ({ ...p, status: 'ativo' }))
                          })}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-semibold text-green-700 rounded-xl transition-all"
                        >
                          Reativar Contrato
                        </button>
                      )}
                      {selecionadoProduto.status !== 'encerrado' && (
                        <button
                          onClick={() => alterarStatusProduto(selecionadoProduto, 'encerrado').then(() => {
                            setSelecionadoProduto(p => ({ ...p, status: 'encerrado' }))
                          })}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl transition-all"
                        >
                          Encerrar Contrato
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Remover contrato de "${PRODUTOS_CATALOGO[selecionadoProduto.produto]?.titulo || selecionadoProduto.titulo || selecionadoProduto.produto}"? Esta ação não pode ser desfeita.`)) {
                            plataformaProdutoService.remover(id, selecionadoProduto.id).then(() => {
                              carregarProdutos()
                              fecharProdutoModal()
                            }).catch(() => alert('Erro ao remover contrato.'))
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-600 rounded-xl transition-all ml-auto"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {empresa.valor_mensal === null && (
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Tipo de Cobrança</label>
                      <select
                        value={formEditProduto.tipo}
                        onChange={e => setFEP('tipo', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="pontual">Cobrança Única (Pontual)</option>
                        <option value="recorrente_mensal">Cobrança Mensal (Recorrente)</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">
                        {empresa.valor_mensal !== null ? 'Qtd. Máxima de Testes' : 'Pacote de Empregados'}
                      </label>
                      <select
                        value={['10', '20', '50', '100', '300', '500'].includes(String(formEditProduto.limite_colaboradores)) ? String(formEditProduto.limite_colaboradores) : 'custom'}
                        onChange={e => {
                          const val = e.target.value
                          if (val === 'custom') {
                            setFEP('limite_colaboradores', '150')
                          } else {
                            setFEP('limite_colaboradores', val)
                          }
                        }}
                        className="input-field text-sm"
                      >
                        <option value="10">📦 10 testes/empregados</option>
                        <option value="20">📦 20 testes/empregados</option>
                        <option value="50">📦 50 testes/empregados</option>
                        <option value="100">📦 100 testes/empregados</option>
                        <option value="300">📦 300 testes/empregados</option>
                        <option value="500">📦 500 testes/empregados</option>
                        <option value="custom">✍️ Personalizado...</option>
                      </select>
                    </div>
                    {!['10', '20', '50', '100', '300', '500'].includes(String(formEditProduto.limite_colaboradores)) && (
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Qtd. de Testes</label>
                        <input
                          type="number"
                          min="1"
                          value={formEditProduto.limite_colaboradores || ''}
                          onChange={e => setFEP('limite_colaboradores', e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {empresa.valor_mensal === null && (
                    <>
                      {formEditProduto.tipo === 'pontual' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por empregado (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formEditProduto.valor_unitario || ''}
                              onChange={e => setFEP('valor_unitario', e.target.value)}
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Aplicações/ano</label>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={formEditProduto.quantidade_aplicacoes || ''}
                              onChange={e => setFEP('quantidade_aplicacoes', e.target.value)}
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por empregado (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formEditProduto.valor_unitario || ''}
                              onChange={e => setFEP('valor_unitario', e.target.value)}
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor mensal (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formEditProduto.valor_mensal || ''}
                              onChange={e => setFEP('valor_mensal', e.target.value)}
                              placeholder="Auto-calculado ou override"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de Início</label>
                      <input
                        type="date"
                        value={formEditProduto.data_inicio}
                        onChange={e => setFEP('data_inicio', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Nº do Contrato</label>
                      <input
                        value={formEditProduto.numero_contrato || 'Gerado automaticamente...'}
                        disabled
                        className="input-field text-sm bg-rp-cinza-claro text-rp-cinza-medio cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Observações Internas</label>
                    <textarea
                      rows={3}
                      value={formEditProduto.observacoes}
                      onChange={e => setFEP('observacoes', e.target.value)}
                      className="input-field text-sm resize-none"
                    />
                  </div>

                  {erroEditProduto && <p className="text-xs text-red-600 font-semibold">{erroEditProduto}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-between bg-rp-cinza-claro flex-shrink-0">
              {!editandoProduto ? (
                <>
                  <Button variant="outline" size="sm" onClick={fecharProdutoModal}>Fechar</Button>
                  <Button variant="primary" size="sm" onClick={iniciarEdicaoProduto}>
                    <Edit2 size={13} className="mr-1 inline animate-none" /> Editar Configurações
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditandoProduto(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" loading={salvandoEditProduto} onClick={salvarEdicaoProduto}>
                    Salvar Alterações
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Cliente */}
      {removerModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-rp-cinza-borda flex flex-col transform transition-all scale-100">
            <div className="px-6 py-5 flex flex-col items-center text-center border-b border-rp-cinza-borda bg-red-50/50">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 animate-bounce">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-rp-azul text-lg">Remover Cliente?</h3>
              <p className="text-xs text-rp-cinza-medio mt-1">
                Esta ação é definitiva e removerá a empresa do sistema.
              </p>
            </div>

            <div className="p-6 space-y-4 text-center">
              <p className="text-sm text-rp-texto leading-relaxed">
                Você tem certeza de que deseja excluir permanentemente o cliente{' '}
                <strong className="text-rp-azul">{empresa.nome_fantasia}</strong>?<br />
                Todos os empregados, setores, pesquisas e dados associados serão removidos do ambiente ativo.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-rp-cinza-borda flex items-center justify-center gap-3 bg-rp-cinza-claro">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRemoverModalAberto(false)}
                disabled={removendo}
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                loading={removendo} 
                onClick={confirmarRemocao}
                className="bg-rp-critico text-white hover:bg-red-700 font-semibold"
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
