import { useEffect, useState, useCallback } from 'react'
import { UserPlus, ArrowUpCircle, Trash2, X, Save, ShieldCheck } from 'lucide-react'
import { usuarioService } from '../../services/adminService'

export const PERFIS = [
  { value: 'admin',     label: 'Administrador', desc: 'Acesso total, incluindo usuários e configurações' },
  { value: 'gestor',    label: 'Gestor',        desc: 'Opera os módulos do dia a dia' },
  { value: 'consultor', label: 'Consultor',     desc: 'Apoio externo, sem gestão de usuários' },
  { value: 'leitura',   label: 'Somente leitura', desc: 'Visualiza indicadores, não altera nada' },
]

const GRUPOS = [
  { value: '',            label: 'Não trata escuta' },
  { value: 'rh',          label: 'RH' },
  { value: 'diretoria',   label: 'Diretoria' },
  { value: 'presidencia', label: 'Presidência' },
]

const perfilLabel = (v) => PERFIS.find((p) => p.value === v)?.label ?? v

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Modal({ titulo, children, onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-rp-azul">{titulo}</h4>
          <button onClick={onFechar} className="text-rp-cinza-medio hover:text-rp-texto"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Gestão de usuários do painel: criar do zero, promover funcionário existente,
 * definir perfil e grupo de tratamento do Canal de Escuta.
 */
export function GestaoUsuarios({ usuarios, setUsuarios, usuarioAtualId }) {
  const [modal, setModal] = useState(null) // 'novo' | 'promover'
  const [form, setForm] = useState({})
  const [elegiveis, setElegiveis] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const abrir = useCallback((tipo) => {
    setForm({ perfil: 'gestor', grupo_escuta: '', nome: '', email: '', senha: '', colaborador_id: '' })
    setErro('')
    setModal(tipo)
    if (tipo === 'promover') {
      usuarioService.colaboradoresElegiveis()
        .then((res) => setElegiveis(res.data ?? []))
        .catch(() => setElegiveis([]))
    }
  }, [])

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const payload = modal === 'promover'
        ? { colaborador_id: Number(form.colaborador_id), perfil: form.perfil, grupo_escuta: form.grupo_escuta || null, senha: form.senha }
        : { nome: form.nome, email: form.email, perfil: form.perfil, grupo_escuta: form.grupo_escuta || null, senha: form.senha }

      const novo = modal === 'promover'
        ? await usuarioService.promover(payload)
        : await usuarioService.criar(payload)

      setUsuarios((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setModal(null)
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar. Verifique os dados.')
    } finally {
      setSalvando(false)
    }
  }

  async function alterar(id, campo, valor) {
    const anterior = usuarios.find((u) => u.id === id)?.[campo]
    setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, [campo]: valor } : u))
    try {
      await usuarioService.atualizar(id, { [campo]: valor })
    } catch (err) {
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, [campo]: anterior } : u))
      setErro(err.response?.data?.message || 'Não foi possível atualizar o usuário.')
    }
  }

  async function remover(u) {
    if (!window.confirm(`Remover o acesso de ${u.nome} ao painel? O cadastro de funcionário, se existir, não é afetado.`)) return
    try {
      await usuarioService.remover(u.id)
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id))
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível remover.')
    }
  }

  const podeSalvar = modal === 'promover'
    ? form.colaborador_id && form.senha?.length >= 8
    : form.nome?.trim() && form.email?.trim() && form.senha?.length >= 8

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h4 className="text-sm font-bold text-rp-azul mb-1">Usuários do painel</h4>
          <p className="text-xs text-rp-cinza-medio">
            Quem acessa a área administrativa. O perfil define o que a pessoa enxerga; o grupo de
            tratamento define quais relatos do Canal de Escuta ela recebe.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => abrir('promover')}
            className="flex items-center gap-1.5 text-xs font-semibold text-rp-azul border border-rp-cinza-borda rounded-lg px-3 py-2 hover:border-rp-azul transition-colors">
            <ArrowUpCircle size={13} /> Promover funcionário
          </button>
          <button onClick={() => abrir('novo')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rp-azul rounded-lg px-3 py-2 hover:bg-rp-azul-deep transition-colors">
            <UserPlus size={13} /> Novo usuário
          </button>
        </div>
      </div>

      {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}

      <div className="space-y-2 mt-4">
        {usuarios.length === 0 && <p className="text-sm text-rp-cinza-medio text-center py-4">Nenhum usuário cadastrado.</p>}
        {usuarios.map((u) => {
          const souEu = u.id === usuarioAtualId
          return (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-xl border ${u.ativo === false ? 'border-rp-cinza-borda bg-rp-cinza-claro/40 opacity-70' : 'border-rp-cinza-borda'}`}>
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-rp-texto truncate flex items-center gap-1.5">
                  {u.nome}
                  {souEu && <span className="text-[10px] font-bold text-rp-azul bg-rp-azul-suave px-1.5 py-0.5 rounded-full">VOCÊ</span>}
                  {u.ativo === false && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">INATIVO</span>}
                </p>
                <p className="text-xs text-rp-cinza-medio truncate">{u.email}</p>
              </div>

              <select
                value={u.perfil ?? ''}
                onChange={(e) => alterar(u.id, 'perfil', e.target.value)}
                disabled={souEu}
                title={souEu ? 'Você não pode alterar o próprio perfil' : 'Perfil de acesso'}
                className="text-sm border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 disabled:opacity-50"
              >
                {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <select
                value={u.grupo_escuta ?? ''}
                onChange={(e) => alterar(u.id, 'grupo_escuta', e.target.value || null)}
                title="Grupo de tratamento do Canal de Escuta"
                className="text-sm border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30"
              >
                {GRUPOS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>

              {!souEu && (
                <button onClick={() => remover(u)} title="Remover acesso"
                  className="text-rp-cinza-medio hover:text-red-600 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal titulo={modal === 'promover' ? 'Promover funcionário a usuário' : 'Novo usuário do painel'} onFechar={() => setModal(null)}>
          <div className="space-y-3">
            {modal === 'promover' ? (
              <>
                <p className="text-xs text-rp-cinza-medio leading-relaxed">
                  O funcionário continua usando o app normalmente e passa a ter também acesso ao painel.
                </p>
                <Campo label="Funcionário">
                  <select value={form.colaborador_id} onChange={(e) => setForm((f) => ({ ...f, colaborador_id: e.target.value }))} className="input-field">
                    <option value="">Selecione</option>
                    {elegiveis.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.email}{c.cargo ? ` · ${c.cargo}` : ''}</option>
                    ))}
                  </select>
                  {elegiveis.length === 0 && (
                    <p className="text-[11px] text-rp-cinza-medio mt-1.5">
                      Nenhum funcionário elegível: é preciso ter e-mail cadastrado e ainda não possuir acesso ao painel.
                    </p>
                  )}
                </Campo>
              </>
            ) : (
              <>
                <Campo label="Nome">
                  <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="input-field" />
                </Campo>
                <Campo label="E-mail">
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input-field" />
                </Campo>
              </>
            )}

            <Campo label="Perfil de acesso">
              <select value={form.perfil} onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))} className="input-field">
                {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <p className="text-[11px] text-rp-cinza-medio mt-1.5">
                {PERFIS.find((p) => p.value === form.perfil)?.desc}
              </p>
            </Campo>

            <Campo label="Grupo de tratamento (Canal de Escuta)">
              <select value={form.grupo_escuta} onChange={(e) => setForm((f) => ({ ...f, grupo_escuta: e.target.value }))} className="input-field">
                {GRUPOS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Campo>

            <Campo label="Senha provisória">
              <input type="password" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 8 caracteres" className="input-field" />
              <p className="text-[11px] text-rp-cinza-medio mt-1.5 flex items-start gap-1.5">
                <ShieldCheck size={12} className="flex-shrink-0 mt-0.5" />
                Combine a senha com a pessoa por um canal seguro e peça que ela troque no primeiro acesso.
              </p>
            </Campo>

            {erro && <p className="text-xs text-red-600">{erro}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-rp-cinza-borda text-xs font-semibold text-rp-cinza-medio hover:bg-rp-cinza-claro transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={!podeSalvar || salvando}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rp-azul text-white text-xs font-semibold hover:bg-rp-azul-deep transition-colors disabled:opacity-40">
                <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export { perfilLabel }
