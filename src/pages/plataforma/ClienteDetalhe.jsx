import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Grid, ClipboardList, Edit2, Check, AlertTriangle, Package, Plus, X, DollarSign } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService, plataformaProdutoService } from '../../services/plataformaService'
import { formatDate } from '../../utils/formatters'

const PRODUTOS_CATALOGO = {
  diagnostico_nr1: { titulo: 'Diagnóstico Psicossocial NR-1', tipoSugerido: 'pontual',           sub: 'R$/colaborador · 2 aplicações/ano' },
  plano_acao_nr1:  { titulo: 'Plano de Ação Continuado NR-1', tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente' },
  canal_escuta:    { titulo: 'Canal de Escuta Profissional',  tipoSugerido: 'recorrente_mensal', sub: 'Mensal recorrente · headcount' },
}

const STATUS_PRODUTO = {
  ativo:        { label: 'Ativo',        cls: 'bg-green-100 text-green-700' },
  pausado:      { label: 'Pausado',      cls: 'bg-yellow-100 text-yellow-700' },
  encerrado:    { label: 'Encerrado',    cls: 'bg-gray-100 text-gray-500' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700' },
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
  const [editForm, setEditForm] = useState({ plano: '', max_colaboradores: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [produtos, setProdutos] = useState([])
  const [colaboradoresAtivos, setColaboradoresAtivos] = useState(0)
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false)
  const [formProduto, setFormProduto] = useState({
    produto: 'diagnostico_nr1',
    tipo: 'pontual',
    valor_unitario: '30',
    valor_mensal: '',
    quantidade_aplicacoes: '2',
    data_inicio: new Date().toISOString().substring(0, 10),
    numero_contrato: '',
    observacoes: '',
  })
  const [salvandoProduto, setSalvandoProduto] = useState(false)
  const [erroProduto, setErroProduto] = useState('')

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
        } else {
          next.valor_unitario = ''
          next.quantidade_aplicacoes = ''
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
        tipo:                  formProduto.tipo,
        valor_unitario:        formProduto.valor_unitario ? Number(formProduto.valor_unitario) : null,
        valor_mensal:          formProduto.valor_mensal   ? Number(formProduto.valor_mensal)   : null,
        quantidade_aplicacoes: formProduto.quantidade_aplicacoes ? Number(formProduto.quantidade_aplicacoes) : null,
        data_inicio:           formProduto.data_inicio,
        numero_contrato:       formProduto.numero_contrato || null,
        observacoes:           formProduto.observacoes     || null,
      }
      await plataformaProdutoService.contratar(id, payload)
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
    if (!window.confirm(`Remover contrato de "${produto.titulo}"? Esta ação não pode ser desfeita.`)) return
    try {
      await plataformaProdutoService.remover(id, produto.id)
      await carregarProdutos()
    } catch { alert('Erro ao remover contrato.') }
  }

  function startEdit() {
    setEditForm({ plano: empresa.plano, max_colaboradores: empresa.max_colaboradores ?? '' })
    setEditMode(true)
  }

  async function saveEdit() {
    setSaving(true)
    setError('')
    try {
      const updated = await plataformaEmpresaService.atualizar(id, {
        plano: editForm.plano,
        max_colaboradores: editForm.max_colaboradores ? Number(editForm.max_colaboradores) : undefined,
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

  return (
    <div className="max-w-4xl">
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

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { icon: Users,        label: 'Colaboradores', value: empresa.colaboradores_count ?? 0, note: `de ${empresa.max_colaboradores ?? '∞'}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Grid,         label: 'Setores',       value: empresa.setores_count       ?? 0, color: 'text-rp-azul',    bg: 'bg-rp-azul-suave' },
          { icon: ClipboardList,label: 'Pesquisas',     value: empresa.pesquisas_count     ?? 0, color: 'text-rp-laranja', bg: 'bg-orange-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
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
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-rp-texto mb-1.5">Limite de colaboradores</label>
                  <input
                    type="number"
                    value={editForm.max_colaboradores}
                    onChange={(e) => setEditForm((f) => ({ ...f, max_colaboradores: e.target.value }))}
                    className="input-field"
                    min="1"
                  />
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
                  ['Limite de colaboradores', empresa.max_colaboradores ?? '—'],
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

          {/* ── Produtos contratados ── */}
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rp-azul flex items-center gap-2">
                <Package size={14} />
                Produtos contratados ({produtos.length})
              </h3>
              {!novoProdutoAberto && (
                <Button variant="outline" size="sm" onClick={() => setNovoProdutoAberto(true)}>
                  <Plus size={12} /> Novo contrato
                </Button>
              )}
            </div>

            {novoProdutoAberto && (
              <div className="bg-rp-azul-suave/40 border border-rp-azul/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-rp-azul">Novo contrato</p>
                  <button onClick={() => setNovoProdutoAberto(false)} className="text-rp-cinza-medio hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Produto</label>
                    <select value={formProduto.produto} onChange={e => setFP('produto', e.target.value)} className="input-field text-sm">
                      {Object.entries(PRODUTOS_CATALOGO).map(([key, p]) => (
                        <option key={key} value={key}>{p.titulo} — {p.sub}</option>
                      ))}
                    </select>
                  </div>

                  {formProduto.tipo === 'pontual' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Valor por colaborador (R$)</label>
                        <input type="number" step="0.01" value={formProduto.valor_unitario} onChange={e => setFP('valor_unitario', e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Aplicações/ano</label>
                        <input type="number" min="1" max="12" value={formProduto.quantidade_aplicacoes} onChange={e => setFP('quantidade_aplicacoes', e.target.value)} className="input-field text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Valor mensal (R$)</label>
                      <input type="number" step="0.01" value={formProduto.valor_mensal} onChange={e => setFP('valor_mensal', e.target.value)} placeholder="Sob consulta · pode deixar vazio" className="input-field text-sm" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Data de início</label>
                      <input type="date" value={formProduto.data_inicio} onChange={e => setFP('data_inicio', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Nº contrato (opcional)</label>
                      <input value={formProduto.numero_contrato} onChange={e => setFP('numero_contrato', e.target.value)} placeholder="Ex: SLC-2026-001" className="input-field text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Observações</label>
                    <textarea rows={2} value={formProduto.observacoes} onChange={e => setFP('observacoes', e.target.value)} placeholder="Notas internas (não visíveis ao cliente)" className="input-field text-sm resize-none" />
                  </div>

                  {erroProduto && <p className="text-xs text-red-600">{erroProduto}</p>}

                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={salvandoProduto} onClick={contratarProduto}>Registrar contrato</Button>
                    <Button variant="outline" size="sm" onClick={() => setNovoProdutoAberto(false)}>Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {produtos.length === 0 && !novoProdutoAberto ? (
              <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                <Package size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                <p className="text-sm text-rp-cinza-medio">Nenhum produto contratado.</p>
                <p className="text-xs text-rp-cinza-medio">Use "Novo contrato" para registrar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {produtos.map(p => {
                  const st = STATUS_PRODUTO[p.status] ?? STATUS_PRODUTO.ativo
                  return (
                    <div key={p.id} className="border border-rp-cinza-borda rounded-xl p-4 hover:border-rp-azul/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-rp-texto">{p.titulo}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                            <span className="text-[10px] text-rp-cinza-medio bg-rp-cinza-claro px-2 py-0.5 rounded">
                              {p.tipo === 'pontual' ? 'Pontual' : 'Mensal'}
                            </span>
                          </div>
                          <div className="text-xs text-rp-cinza-medio flex flex-wrap gap-x-4 gap-y-1">
                            {p.tipo === 'pontual' && p.valor_unitario && (
                              <span><DollarSign size={10} className="inline" /> {formatBRL(p.valor_unitario)}/colab × {p.quantidade_aplicacoes ?? 1}/ano</span>
                            )}
                            {p.tipo === 'recorrente_mensal' && (
                              <span><DollarSign size={10} className="inline" /> {formatBRL(p.valor_mensal)} /mês</span>
                            )}
                            {p.valor_projetado_anual !== null && p.valor_projetado_anual !== undefined && (
                              <span className="font-semibold text-rp-azul">
                                Projeção anual: {formatBRL(p.valor_projetado_anual)}
                              </span>
                            )}
                            {p.data_inicio && <span>Início: {new Date(p.data_inicio).toLocaleDateString('pt-BR')}</span>}
                            {p.numero_contrato && <span>Contrato: {p.numero_contrato}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {p.status === 'ativo' && (
                            <button onClick={() => alterarStatusProduto(p, 'pausado')} className="text-xs px-2 py-1 rounded text-yellow-700 hover:bg-yellow-50">Pausar</button>
                          )}
                          {p.status === 'pausado' && (
                            <button onClick={() => alterarStatusProduto(p, 'ativo')} className="text-xs px-2 py-1 rounded text-green-700 hover:bg-green-50">Reativar</button>
                          )}
                          {p.status !== 'encerrado' && (
                            <button onClick={() => alterarStatusProduto(p, 'encerrado')} className="text-xs px-2 py-1 rounded text-rp-cinza-medio hover:bg-rp-cinza-claro">Encerrar</button>
                          )}
                          <button onClick={() => removerProduto(p)} className="text-xs px-2 py-1 rounded text-rp-cinza-medio hover:text-red-500 hover:bg-red-50" title="Remover">
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="mt-3 pt-3 border-t border-rp-cinza-borda text-[11px] text-rp-cinza-medio">
                  Base de cálculo: <strong>{colaboradoresAtivos}</strong> colaboradores ativos
                </div>
              </div>
            )}
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

        <div className="space-y-4">
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

          {empresa.status !== 'cancelado' && (
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-bold text-rp-azul mb-4">Ações</h3>
              <Button variant="outline" fullWidth onClick={toggleStatus}>
                {empresa.status === 'ativo' ? (
                  <><AlertTriangle size={14} /> Suspender acesso</>
                ) : (
                  <><Check size={14} /> Reativar acesso</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
