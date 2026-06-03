import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, UserPlus, X, Eye, EyeOff, Pencil, Download, Upload, Trash2, Mail } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { ImportCsvModal } from '../../components/ui/ImportCsvModal'
import { colaboradorService, setorService } from '../../services/adminService'

const statusStyle = {
  ativo:    'bg-green-100 text-green-700',
  inativo:  'bg-gray-100 text-gray-500',
  afastado: 'bg-yellow-100 text-yellow-700',
}

const FORM_NOVO = {
  nome: '', email: '', senha: '', cargo: '', setor_id: '', cpf: '', data_admissao: '',
}

function ColaboradorModal({ colaborador, setores, onClose, onSaved }) {
  const editando = !!colaborador
  const [form, setForm] = useState(
    editando
      ? {
          nome:          colaborador.nome         ?? '',
          email:         colaborador.email        ?? '',
          cargo:         colaborador.cargo        ?? '',
          setor_id:      colaborador.setor_id     ?? colaborador.setor?.id ?? '',
          cpf:           colaborador.cpf          ?? '',
          data_admissao: colaborador.data_admissao ?? '',
          status:        colaborador.status       ?? 'ativo',
          senha:         '',
        }
      : FORM_NOVO
  )
  const [showSenha, setShowSenha] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!editando && !form.senha) { setError('Senha é obrigatória.'); return }
    if (!form.setor_id) { setError('Selecione um setor.'); return }

    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.cpf)           delete payload.cpf
      if (!payload.data_admissao) delete payload.data_admissao
      if (!payload.cargo)         delete payload.cargo
      if (editando && !payload.senha) delete payload.senha

      if (editando) {
        await colaboradorService.atualizar(colaborador.id, payload)
      } else {
        await colaboradorService.criar(payload)
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao salvar empregado.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <h2 className="text-base font-bold text-rp-azul">
            {editando ? 'Editar empregado' : 'Novo empregado'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome completo *</label>
              <input value={form.nome} onChange={(e) => set('nome', e.target.value)}
                placeholder="Ex: Ana Lima" className="input-field" required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail *</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="ana@empresa.com.br" className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">CPF</label>
              <input value={form.cpf} onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Cargo</label>
              <input value={form.cargo} onChange={(e) => set('cargo', e.target.value)}
                placeholder="Ex: Analista" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Setor *</label>
              <select value={form.setor_id} onChange={(e) => set('setor_id', e.target.value)}
                className="input-field" required>
                <option value="">Selecione...</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}{s.unidade ? ` (${s.unidade})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Admissão</label>
              <input type="date" value={form.data_admissao} onChange={(e) => set('data_admissao', e.target.value)}
                className="input-field" />
            </div>

            {editando && (
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="afastado">Afastado</option>
                </select>
              </div>
            )}

            {editando && (
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => set('senha', e.target.value)}
                    placeholder="Deixe em branco para manter"
                    className="input-field pr-10"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio p-0.5">
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {!editando && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Senha *</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => set('senha', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input-field pr-10"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio p-0.5">
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" loading={saving}>
              {editando ? 'Salvar alterações' : 'Criar empregado'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Colaboradores({ embedded = false, onImported }) {
  const [colaboradores, setColaboradores] = useState([])
  const [setores, setSetores] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [setorFiltro, setSetorFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [invitingId, setInvitingId] = useState(null)
  const [modal, setModal] = useState(null) // null | 'novo' | 'import' | { colaborador }

  const carregar = useCallback(() => {
    return colaboradorService.listar({
      search:   search || undefined,
      setor:    setorFiltro || undefined,
    }).then((data) => {
      setColaboradores(data.data ?? [])
      setTotal(data.total ?? 0)
    }).catch(console.error)
  }, [search, setorFiltro])

  const carregarSetores = useCallback(() => {
    return setorService.listar()
      .then((data) => setSetores(data.data ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    carregar().finally(() => setLoading(false))
  }, [carregar])

  useEffect(() => {
    carregarSetores()
  }, [carregarSetores])

  function abrirNovo() {
    if (setores.length === 0) {
      alert('Cadastre pelo menos um setor antes de adicionar empregados.')
      return
    }
    setModal('novo')
  }

  function handleSaved() {
    setModal(null)
    carregar()
  }

  async function handleExcluir(colaborador) {
    const confirmado = window.confirm(`Excluir ${colaborador.nome}? Esta ação remove o empregado da lista.`)
    if (!confirmado) return

    setDeletingId(colaborador.id)
    try {
      await colaboradorService.excluir(colaborador.id)
      await carregar()
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao excluir empregado.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleEnviarConvite(colaborador) {
    setInvitingId(colaborador.id)
    try {
      await colaboradorService.enviarConvite(colaborador.id)
      alert(`Convite enviado para ${colaborador.email}.`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao enviar convite.')
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div>
      {!embedded && (
        <PageTitle
          title="Pessoas & setores"
          subtitle={`${total} empregado${total !== 1 ? 'es' : ''}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => colaboradorService.exportar()}>
                <Download size={13} /> Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setModal('import')}>
                <Upload size={13} /> Importar CSV
              </Button>
              <Button variant="primary" size="sm" onClick={abrirNovo}>
                <UserPlus size={13} /> Novo empregado
              </Button>
            </div>
          }
        />
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-rp-cinza-borda">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empregado..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-rp-cinza-claro border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-rp-azul focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-rp-cinza-medio" />
            <select
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="text-sm border border-rp-cinza-borda rounded-lg px-3 py-2 text-rp-cinza-medio focus:outline-none focus:ring-2 focus:ring-rp-azul"
            >
              <option value="">Todos os setores</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          
          {embedded && (
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => colaboradorService.exportar()}>
                <Download size={13} /> Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setModal('import')}>
                <Upload size={13} /> Importar CSV
              </Button>
              <Button variant="primary" size="sm" onClick={abrirNovo}>
                <UserPlus size={13} /> Novo empregado
              </Button>
            </div>
          )}

          {!embedded && <span className="text-xs text-rp-cinza-medio ml-auto">{colaboradores.length} resultado{colaboradores.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-rp-cinza-medio">Carregando empregados...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rp-cinza-borda bg-rp-cinza-claro/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Nome</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden md:table-cell">Setor</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Cargo</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-rp-cinza-medio">
                    {search || setorFiltro ? 'Nenhum empregado encontrado.' : 'Nenhum empregado cadastrado ainda.'}
                  </td>
                </tr>
              )}
              {colaboradores.map((c) => (
                <tr key={c.id} className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#003366' }}
                      >
                        {c.nome?.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-rp-texto">{c.nome}</p>
                        <p className="text-xs text-rp-cinza-medio">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div>
                      <span className="text-sm text-rp-texto">{c.setor?.nome ?? '—'}</span>
                      {c.setor?.unidade && (
                        <p className="text-xs text-rp-cinza-medio">{c.setor.unidade}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <span className="text-sm text-rp-cinza-medio">{c.cargo ?? '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[c.status] ?? statusStyle.inativo}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => setModal({ colaborador: c })}
                        className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-rp-azul-suave"
                        title="Editar empregado"
                        aria-label={`Editar ${c.nome}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEnviarConvite(c)}
                        disabled={invitingId === c.id}
                        className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-rp-azul-suave disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enviar convite"
                        aria-label={`Enviar convite para ${c.nome}`}
                      >
                        <Mail size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(c)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-critico hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir empregado"
                        aria-label={`Excluir ${c.nome}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-rp-cinza-borda">
          <p className="text-xs text-rp-cinza-medio">Mostrando {colaboradores.length} de {total} empregados</p>
        </div>
      </div>

      {modal && modal !== 'import' && (
        <ColaboradorModal
          colaborador={modal === 'novo' ? null : modal.colaborador}
          setores={setores}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {modal === 'import' && (
        <ImportCsvModal
          onClose={() => setModal(null)}
          onImported={() => {
            carregar()
            carregarSetores()
            onImported?.()
          }}
        />
      )}
    </div>
  )
}
