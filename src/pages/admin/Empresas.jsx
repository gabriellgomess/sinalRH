import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Save, X, Trash2, Users } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { empresaService, setorService } from '../../services/adminService'
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
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'novo' | 'import' | { setor }
  const [deletingId, setDeletingId] = useState(null)
  const [activeTab, setActiveTab] = useState('dados') // 'dados' | 'setores' | 'equipe'

  const [formEmpresa, setFormEmpresa] = useState({
    nome_fantasia: '',
    razao_social: '',
    email_contato: '',
    telefone: ''
  })
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false)
  const [erroEmpresa, setErroEmpresa] = useState('')

  function carregarEmpresa() {
    return empresaService.buscar()
      .then(setEmpresa)
      .catch(console.error)
  }

  useEffect(() => {
    carregarEmpresa().finally(() => setLoading(false))
  }, [])

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

  const totalColaboradores = setores.reduce((sum, s) => sum + (s.colaboradores_count ?? 0), 0)

  const campos = empresa ? [
    { label: 'NOME FANTASIA',          key: 'nome_fantasia', value: empresa.nome_fantasia ?? '—', editable: true },
    { label: 'RAZÃO SOCIAL',           key: 'razao_social',  value: empresa.razao_social  ?? '—', editable: true },
    { label: 'CNPJ',                   key: 'cnpj',          value: empresa.cnpj           ?? '—', editable: false },
    { label: 'SEGMENTO',               key: 'segmento',      value: empresa.segmento       ?? '—', editable: false },
    { label: 'E-MAIL DE CONTATO',      key: 'email_contato', value: empresa.email_contato  ?? '—', editable: true },
    { label: 'TELEFONE',               key: 'telefone',      value: empresa.telefone       ?? '—', editable: true },
    { label: 'TOTAL DE COLABORADORES', key: 'colaboradores', value: `${totalColaboradores} colaboradores`, editable: false },
    { label: 'CONSULTOR RESPONSÁVEL',  key: 'consultor',     value: empresa.consultor_slc  ?? '—', editable: false },
  ] : []

  function handleStartEdit() {
    setFormEmpresa({
      nome_fantasia: empresa?.nome_fantasia ?? '',
      razao_social: empresa?.razao_social ?? '',
      email_contato: empresa?.email_contato ?? '',
      telefone: empresa?.telefone ?? ''
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
        telefone: formEmpresa.telefone.trim() || null
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
    if (!window.confirm('Remover este setor? Colaboradores vinculados ficarão sem setor.')) return
    setDeletingId(id)
    try {
      await setorService.excluir(id)
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

  return (
    <div>
      <PageTitle
        title="Minha empresa"
        subtitle={loading ? 'Carregando...' : `${empresa?.nome_fantasia ?? '—'} · Gestão de estrutura, setores e equipe`}
      />

      {/* Tabs */}
      <div className="flex border-b border-rp-cinza-borda mb-6">
        {[
          { id: 'dados',   label: 'Dados da Empresa' },
          { id: 'setores', label: 'Estrutura & Setores' },
          { id: 'equipe',  label: 'Equipe de Colaboradores' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
                      <input
                        value={formEmpresa[key]}
                        onChange={(e) => setFormEmpresa(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-sm input-field py-1.5"
                      />
                    ) : (
                      <p className="text-sm text-rp-texto font-semibold">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'setores' && (
            <div className="bg-white rounded-xl p-6 shadow-card max-w-4xl">
              <div className="flex items-center justify-between mb-6 border-b border-rp-cinza-borda pb-4">
                <div>
                  <h3 className="text-base font-bold text-rp-azul">Unidades & setores</h3>
                  <p className="text-xs text-rp-cinza-medio mt-0.5">{unidades.length} unidade{unidades.length !== 1 ? 's' : ''} · {setores.length} setor{setores.length !== 1 ? 'es' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setModal('novo')}>
                    <Plus size={13} /> Novo setor
                  </Button>
                </div>
              </div>

              {unidades.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-rp-cinza-medio mb-4">Nenhum setor cadastrado.</p>
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
                        {unidade.setores.map((setor) => (
                          <div key={setor.id} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-rp-cinza-borda hover:bg-rp-cinza-claro transition-all group">
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
                                onClick={() => setModal({ setor })}
                                className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleExcluirSetor(setor.id)}
                                disabled={deletingId === setor.id}
                                className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-red-600 hover:bg-white border border-transparent hover:border-rp-cinza-borda transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipe' && (
            <Colaboradores embedded={true} onImported={carregarEmpresa} />
          )}
        </div>
      )}



      {modal && modal !== 'import' && (
        <SetorModal
          setor={modal === 'novo' ? null : modal.setor}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
