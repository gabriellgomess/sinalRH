import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Save, X, Trash2, Package, ExternalLink, Receipt } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { empresaService, setorService, produtosContratadosService, cobrancaAdminService } from '../../services/adminService'
import Colaboradores from './Colaboradores'

function iniciais(nome) {
  return (nome ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const FORM_VAZIO = { nome: '', unidade: '', responsavel: '' }

const CICLOS_LABEL = { WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual' }

const STATUS_COBRANCA = {
  pendente:  { label: 'Aguardando', cls: 'bg-gray-100 text-gray-600' },
  ativa:     { label: 'Ativa',      cls: 'bg-blue-100 text-blue-700' },
  paga:      { label: 'Paga',       cls: 'bg-green-100 text-green-700' },
  atrasada:  { label: 'Em atraso',  cls: 'bg-red-100 text-red-700' },
  cancelada: { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-400' },
}

const STATUS_SERVICO = {
  ativo:        { label: 'Ativo',        cls: 'bg-green-100 text-green-700' },
  pausado:      { label: 'Pausado',      cls: 'bg-yellow-100 text-yellow-700' },
  encerrado:    { label: 'Encerrado',    cls: 'bg-gray-100 text-gray-500' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700' },
}

// aba antiga → aba nova (compatibilidade com links salvos)
const TABS_VALIDAS = ['dados', 'pessoas', 'servicos']
const TAB_ALIASES = { setores: 'pessoas', equipe: 'pessoas' }

function formatBRL(v) {
  if (v === null || v === undefined || v === '') return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

function SetorModal({ setor, onClose, onSaved }) {
  const [form, setForm] = useState(
    setor ? { nome: setor.nome, unidade: setor.unidade ?? '', responsavel: setor.responsavel ?? '' }
          : FORM_VAZIO
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        nome:        form.nome.trim(),
        unidade:     form.unidade.trim() || null,
        responsavel: form.responsavel.trim() || null,
      }
      if (setor) {
        await setorService.atualizar(setor.id, payload)
      } else {
        await setorService.criar(payload)
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao salvar setor.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <h2 className="text-base font-bold text-rp-azul">
            {setor ? 'Editar setor' : 'Novo setor'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: Recursos Humanos"
              className="input-field"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rp-texto mb-1.5">Unidade / Área</label>
            <input
              value={form.unidade}
              onChange={(e) => set('unidade', e.target.value)}
              placeholder="Ex: Matriz SP"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rp-texto mb-1.5">Responsável</label>
            <input
              value={form.responsavel}
              onChange={(e) => set('responsavel', e.target.value)}
              placeholder="Ex: Ana Lima"
              className="input-field"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" loading={saving}>
              {setor ? 'Salvar alterações' : 'Criar setor'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Empresas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [empresa, setEmpresa] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'novo' | { setor }
  const [deletingId, setDeletingId] = useState(null)
  const [setorSelecionado, setSetorSelecionado] = useState('') // filtro da equipe por setor

  const [servicos, setServicos] = useState([])
  const [cobrancas, setCobrancas] = useState([])
  const [totalAberto, setTotalAberto] = useState(0)
  const [loadingFin, setLoadingFin] = useState(false)
  const [finCarregado, setFinCarregado] = useState(false)

  const [formEmpresa, setFormEmpresa] = useState({
    nome_fantasia: '',
    razao_social: '',
    email_contato: '',
    telefone: '',
    total_colaboradores: ''
  })
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false)
  const [erroEmpresa, setErroEmpresa] = useState('')

  // Aba ativa vive na URL (?tab=) — permite F5 e deep-link
  const tabParam = searchParams.get('tab') ?? 'dados'
  const tabNormalizada = TAB_ALIASES[tabParam] ?? tabParam
  const activeTab = TABS_VALIDAS.includes(tabNormalizada) ? tabNormalizada : 'dados'

  function irParaTab(id) {
    setSearchParams(id === 'dados' ? {} : { tab: id })
  }

  function carregarEmpresa() {
    return empresaService.buscar()
      .then(setEmpresa)
      .catch(console.error)
  }

  useEffect(() => {
    carregarEmpresa().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'servicos' && !finCarregado) {
      setLoadingFin(true)
      Promise.all([produtosContratadosService.listar(), cobrancaAdminService.listar()])
        .then(([prod, cob]) => {
          setServicos(prod?.data ?? [])
          setCobrancas(cob?.data?.cobrancas ?? [])
          setTotalAberto(cob?.data?.total_aberto ?? 0)
          setFinCarregado(true)
        })
        .catch(console.error)
        .finally(() => setLoadingFin(false))
    }
  }, [activeTab, finCarregado])

  const setores = empresa?.setores ?? []
  const unidadesMap = setores.reduce((acc, s) => {
    const key = s.unidade || 'Geral'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})
  const unidades = Object.entries(unidadesMap).map(([nome, items]) => ({
    nome,
    pessoas: items.reduce((sum, s) => sum + (s.colaboradores_count ?? 0), 0),
    setores: items
  }))

  const totalCalculado = setores.reduce((sum, s) => sum + (s.colaboradores_count ?? 0), 0)
  const totalColaboradores = empresa?.total_colaboradores ?? totalCalculado

  const campos = empresa ? [
    { label: 'NOME FANTASIA',          key: 'nome_fantasia',        value: empresa.nome_fantasia ?? '—', editable: true },
    { label: 'RAZÃO SOCIAL',           key: 'razao_social',         value: empresa.razao_social  ?? '—', editable: true },
    { label: 'CNPJ',                   key: 'cnpj',                 value: empresa.cnpj           ?? '—', editable: false },
    { label: 'SEGMENTO',               key: 'segmento',             value: empresa.segmento       ?? '—', editable: false },
    { label: 'E-MAIL DE CONTATO',      key: 'email_contato',        value: empresa.email_contato  ?? '—', editable: true },
    { label: 'TELEFONE',               key: 'telefone',             value: empresa.telefone       ?? '—', editable: true },
    { label: 'TOTAL DE COLABORADORES', key: 'total_colaboradores',  value: `${totalColaboradores} colaboradores`, editable: true },
    { label: 'CONSULTOR RESPONSÁVEL',  key: 'consultor',            value: empresa.consultor_slc  ?? '—', editable: false },
  ] : []

  function handleStartEdit() {
    setFormEmpresa({
      nome_fantasia: empresa?.nome_fantasia ?? '',
      razao_social: empresa?.razao_social ?? '',
      email_contato: empresa?.email_contato ?? '',
      telefone: empresa?.telefone ?? '',
      total_colaboradores: empresa?.total_colaboradores_custom ?? ''
    })
    setErroEmpresa('')
    setEditMode(true)
  }

  async function handleSaveEmpresa() {
    setSalvandoEmpresa(true)
    setErroEmpresa('')
    try {
      await empresaService.atualizar(empresa.id, {
        nome_fantasia: formEmpresa.nome_fantasia.trim(),
        razao_social: formEmpresa.razao_social.trim(),
        email_contato: formEmpresa.email_contato.trim() || null,
        telefone: formEmpresa.telefone.trim() || null,
        total_colaboradores: formEmpresa.total_colaboradores !== '' ? parseInt(formEmpresa.total_colaboradores, 10) : null
      })
      await carregarEmpresa()
      setEditMode(false)
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao salvar alterações da empresa.'
      setErroEmpresa(msg)
    } finally {
      setSalvandoEmpresa(false)
    }
  }

  async function handleExcluirSetor(id) {
    if (!window.confirm('Remover este setor? Empregados vinculados ficarão sem setor.')) return
    setDeletingId(id)
    try {
      await setorService.excluir(id)
      if (String(id) === setorSelecionado) setSetorSelecionado('')
      await carregarEmpresa()
    } catch {
      alert('Erro ao remover setor.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved() {
    setModal(null)
    carregarEmpresa()
  }

  // Clicar num setor filtra a equipe logo abaixo (clicar de novo limpa)
  function selecionarSetor(id) {
    setSetorSelecionado((prev) => {
      const novo = prev === String(id) ? '' : String(id)
      if (novo) {
        setTimeout(() => {
          document.getElementById('secao-equipe')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
      return novo
    })
  }

  return (
    <div>
      <PageTitle
        title="Minha empresa"
        subtitle={loading ? 'Carregando...' : `${empresa?.nome_fantasia ?? '—'} · Dados, pessoas e cobranças`}
      />

      {/* Tabs */}
      <div className="flex border-b border-rp-cinza-borda mb-6">
        {[
          { id: 'dados',    label: 'Dados' },
          { id: 'pessoas',  label: 'Pessoas & Setores' },
          { id: 'servicos', label: 'Cobranças' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => irParaTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-rp-azul text-rp-azul'
                : 'border-transparent text-rp-cinza-medio hover:text-rp-texto hover:border-rp-cinza-borda/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-rp-cinza-medio">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'dados' && (
            <div className="bg-white rounded-xl p-6 shadow-card max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-rp-azul">Dados da empresa</h3>
                  <p className="text-xs text-rp-cinza-medio mt-0.5">Informações cadastrais oficiais</p>
                </div>
                {editMode ? (
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleSaveEmpresa} loading={salvandoEmpresa}>
                      <Save size={13} /> Salvar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={salvandoEmpresa}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Pencil size={13} /> Editar
                  </Button>
                )}
              </div>

              {erroEmpresa && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
                  {erroEmpresa}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campos.map(({ label, key, value, editable }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide">{label}</p>
                    {editMode && editable ? (
                      <div>
                        <input
                          value={formEmpresa[key]}
                          onChange={(e) => setFormEmpresa(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full text-sm input-field py-1.5"
                          type={key === 'total_colaboradores' ? 'number' : 'text'}
                          min={key === 'total_colaboradores' ? '0' : undefined}
                          placeholder={key === 'total_colaboradores' ? `Ex: 15 (Calculado: ${totalCalculado})` : undefined}
                        />
                        {key === 'total_colaboradores' && (
                          <p className="text-[10px] text-rp-cinza-medio mt-1">
                            Deixe em branco para calcular automaticamente com base nos colaboradores ativos cadastrados.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-rp-texto font-semibold">
                        {value}
                        {key === 'total_colaboradores' && (
                          <button
                            type="button"
                            onClick={() => irParaTab('pessoas')}
                            className="ml-2 text-xs font-semibold text-rp-azul hover:underline"
                          >
                            Ver equipe →
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pessoas' && (
            <>
              {/* Setores (master) — clicar num setor filtra a equipe abaixo */}
              <div className="bg-white rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6 border-b border-rp-cinza-borda pb-4">
                  <div>
                    <h3 className="text-base font-bold text-rp-azul">Unidades & setores</h3>
                    <p className="text-xs text-rp-cinza-medio mt-0.5">
                      {unidades.length} unidade{unidades.length !== 1 ? 's' : ''} · {setores.length} setor{setores.length !== 1 ? 'es' : ''}
                      {setores.length > 0 && ' · Clique num setor para ver a equipe dele'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setModal('novo')}>
                      <Plus size={13} /> Novo setor
                    </Button>
                  </div>
                </div>

                {unidades.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-rp-cinza-medio mb-1">Nenhum setor cadastrado.</p>
                    <p className="text-xs text-rp-cinza-medio mb-4">Setores organizam sua equipe — crie o primeiro para depois adicionar os empregados abaixo.</p>
                    <Button variant="primary" size="sm" onClick={() => setModal('novo')}>
                      <Plus size={13} /> Criar primeiro setor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {unidades.map((unidade) => (
                      <div key={unidade.nome} className="border-b border-rp-cinza-borda last:border-0 pb-5 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="1" width="12" height="12" rx="2" stroke="#003366" strokeWidth="1.3"/>
                            <path d="M4 7h6M7 4v6" stroke="#003366" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          <span className="text-sm font-bold text-rp-azul">{unidade.nome}</span>
                          <span className="text-xs text-rp-cinza-medio">· {unidade.pessoas} pessoas</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-5">
                          {unidade.setores.map((setor) => {
                            const selecionado = setorSelecionado === String(setor.id)
                            return (
                              <div
                                key={setor.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => selecionarSetor(setor.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionarSetor(setor.id) } }}
                                title={selecionado ? 'Clique para limpar o filtro da equipe' : 'Clique para ver a equipe deste setor'}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all group cursor-pointer ${
                                  selecionado
                                    ? 'border-rp-azul bg-rp-azul-suave/60 ring-1 ring-rp-azul'
                                    : 'border-rp-cinza-borda hover:bg-rp-cinza-claro'
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: '#003366' }}
                                >
                                  {iniciais(setor.nome)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-rp-texto truncate">{setor.nome}</p>
                                  <p className="text-xs text-rp-cinza-medio truncate">
                                    {setor.responsavel ? `Resp: ${setor.responsavel}` : 'Sem resp.'} · {setor.colaboradores_count ?? 0} cols
                                  </p>
                                </div>
                                <RiskBadge nivel={setor.nivel_risco ?? 'sem_dados'} />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setModal({ setor }) }}
                                    title="Editar setor"
                                    className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleExcluirSetor(setor.id) }}
                                    disabled={deletingId === setor.id}
                                    title="Excluir setor"
                                    className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-red-600 hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipe (detail) — filtrada pelo setor selecionado acima */}
              <div id="secao-equipe">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-rp-azul">Equipe</h3>
                  {setorSelecionado && (
                    <span className="text-xs text-rp-cinza-medio">
                      Mostrando apenas: <strong className="text-rp-azul">{setores.find((s) => String(s.id) === setorSelecionado)?.nome ?? 'setor'}</strong>
                    </span>
                  )}
                </div>
                <Colaboradores
                  embedded={true}
                  onImported={carregarEmpresa}
                  setorFiltro={setorSelecionado}
                  onSetorFiltroChange={setSetorSelecionado}
                  onCriarSetor={() => setModal('novo')}
                />
              </div>
            </>
          )}

          {activeTab === 'servicos' && (
            <div className="space-y-6 max-w-4xl">
              {loadingFin ? (
                <div className="py-12 text-center"><p className="text-sm text-rp-cinza-medio">Carregando...</p></div>
              ) : (
                <>
                  {/* Serviços contratados (acesso) */}
                  <div className="bg-white rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-rp-azul" />
                      <h3 className="text-base font-bold text-rp-azul">Serviços contratados</h3>
                    </div>
                    <p className="text-xs text-rp-cinza-medio mb-5">Funcionalidades liberadas para a sua empresa.</p>
                    {servicos.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                        <Package size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                        <p className="text-sm text-rp-cinza-medio">Nenhum serviço contratado ainda.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {servicos.map((sv) => {
                          const ss = STATUS_SERVICO[sv.status] ?? STATUS_SERVICO.ativo
                          return (
                            <div key={sv.id} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-rp-cinza-borda">
                              <div className="w-9 h-9 rounded-lg bg-rp-azul-suave flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-rp-azul" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-rp-texto truncate">{sv.titulo}</p>
                                <p className="text-[11px] text-rp-cinza-medio">
                                  Desde {sv.data_inicio ? new Date(sv.data_inicio).toLocaleDateString('pt-BR') : '—'}
                                  {sv.limite_colaboradores ? ` · limite ${sv.limite_colaboradores}` : ''}
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss.cls}`}>{ss.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Cobranças */}
                  <div className="bg-white rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Receipt size={16} className="text-rp-azul" />
                        <h3 className="text-base font-bold text-rp-azul">Cobranças</h3>
                      </div>
                      {totalAberto > 0 && (
                        <span className="text-xs font-semibold text-rp-cinza-medio">Em aberto: <strong className="text-rp-azul">{formatBRL(totalAberto)}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-rp-cinza-medio mb-5">Faturas e assinaturas da sua empresa.</p>
                    {cobrancas.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-rp-cinza-borda rounded-xl">
                        <Receipt size={22} className="mx-auto text-rp-cinza-medio mb-2" />
                        <p className="text-sm text-rp-cinza-medio">Nenhuma cobrança registrada.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
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
                              const podePagar = c.asaas_invoice_url && ['pendente', 'ativa', 'atrasada'].includes(c.status)
                              return (
                                <tr key={c.id} className="border-b border-rp-cinza-borda/60">
                                  <td className="py-2.5 px-2 font-semibold text-rp-texto">{c.descricao}</td>
                                  <td className="py-2.5 px-2 text-xs text-rp-cinza-medio">{c.tipo === 'recorrente' ? `Recorrente (${CICLOS_LABEL[c.ciclo] || 'Mensal'})` : 'Única'}</td>
                                  <td className="py-2.5 px-2 text-right font-semibold text-rp-texto">{formatBRL(c.valor)}</td>
                                  <td className="py-2.5 px-2 text-xs text-rp-cinza-medio">{c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                                  <td className="py-2.5 px-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                  <td className="py-2.5 px-2 text-right">
                                    {c.asaas_invoice_url && (
                                      <a href={c.asaas_invoice_url} target="_blank" rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1 text-xs font-bold ${podePagar ? 'text-rp-laranja hover:underline' : 'text-rp-azul hover:underline'}`}>
                                        <ExternalLink size={12} /> {podePagar ? 'Pagar' : 'Fatura'}
                                      </a>
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
                </>
              )}
            </div>
          )}
        </div>
      )}

      {modal && (
        <SetorModal
          setor={modal === 'novo' ? null : modal.setor}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
