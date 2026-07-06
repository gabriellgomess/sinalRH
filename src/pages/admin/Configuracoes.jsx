import { useState, useEffect } from 'react'
import { Bell, Shield, Link2, Users, Palette, Save } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { configuracaoService, usuarioService, empresaService } from '../../services/adminService'

const sections = [
  { icon: Bell,    label: 'Notificações' },
  { icon: Shield,  label: 'Segurança & Privacidade' },
  { icon: Link2,   label: 'Integrações' },
  { icon: Users,   label: 'Usuários & Permissões' },
  { icon: Palette, label: 'Aparência' },
]

export default function Configuracoes() {
  const [activeSection, setActiveSection] = useState('Notificações')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [empresa, setEmpresa] = useState({
    nome_fantasia: '', email_contato: '', telefone: ''
  })
  const [notif, setNotif] = useState({
    alerta_email: true, alerta_critico: true,
    relatorio_semanal: false, resumo_checkin: true,
  })
  const [auditorias, setAuditorias] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [empresaId, setEmpresaId] = useState(null)
  const [comite, setComite] = useState({ escuta_comite_email: '', escuta_comite_nome: '' })
  const [comiteSaving, setComiteSaving] = useState(false)
  const [comiteSaved, setComiteSaved] = useState(false)

  useEffect(() => {
    configuracaoService.buscar()
      .then((data) => {
        setEmpresa({
          nome_fantasia:  data.empresa.nome_fantasia  ?? '',
          email_contato:  data.empresa.email_contato  ?? '',
          telefone:       data.empresa.telefone        ?? '',
        })
        setNotif({
          alerta_email:      data.notificacoes.alerta_email,
          alerta_critico:    data.notificacoes.alerta_critico,
          relatorio_semanal: data.notificacoes.relatorio_semanal,
          resumo_checkin:    data.notificacoes.resumo_checkin,
        })
        setAuditorias(data.auditorias ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    usuarioService.listar().then((res) => setUsuarios(res.data ?? [])).catch(() => {})
    empresaService.buscar().then((emp) => {
      setEmpresaId(emp.id)
      setComite({ escuta_comite_email: emp.escuta_comite_email ?? '', escuta_comite_nome: emp.escuta_comite_nome ?? '' })
    }).catch(() => {})
  }, [])

  async function handleSalvarComite() {
    if (!empresaId) return
    setComiteSaving(true); setComiteSaved(false)
    try {
      await empresaService.atualizar(empresaId, {
        escuta_comite_email: comite.escuta_comite_email || null,
        escuta_comite_nome: comite.escuta_comite_nome || null,
      })
      setComiteSaved(true); setTimeout(() => setComiteSaved(false), 3000)
    } catch (err) { console.error(err) } finally { setComiteSaving(false) }
  }

  async function handleGrupo(userId, grupo) {
    setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, grupo_escuta: grupo || null } : u))
    try {
      await usuarioService.atualizar(userId, { grupo_escuta: grupo || null })
    } catch (err) { console.error(err) }
  }

  async function handleSalvar() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await configuracaoService.salvar({
        nome_fantasia:           empresa.nome_fantasia   || undefined,
        email_contato:           empresa.email_contato   || undefined,
        telefone:                empresa.telefone        || undefined,
        notif_alerta_email:      notif.alerta_email,
        notif_alerta_critico:    notif.alerta_critico,
        notif_relatorio_semanal: notif.relatorio_semanal,
        notif_resumo_checkin:    notif.resumo_checkin,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  const notifItems = [
    { key: 'alerta_email',      label: 'Alertas por e-mail',            desc: 'Receba resumos e alertas críticos por e-mail' },
    { key: 'alerta_critico',    label: 'Alertas críticos imediatos',    desc: 'Notificação imediata para riscos críticos detectados' },
    { key: 'relatorio_semanal', label: 'Relatório semanal automático',  desc: 'Envio automático do relatório semanal por e-mail' },
    { key: 'resumo_checkin',    label: 'Resumo de check-ins',           desc: 'Receba um resumo semanal dos check-ins realizados' },
  ]

  function formatDate(value) {
    if (!value) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  return (
    <div>
      <PageTitle title="Configurações" subtitle="Gerencie as preferências do sistema" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-card p-2">
            {sections.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeSection === label
                    ? 'bg-rp-azul-suave text-rp-azul font-semibold'
                    : 'text-rp-cinza-medio hover:bg-rp-cinza-claro hover:text-rp-texto'
                }`}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="text-base font-bold text-rp-azul mb-5">{activeSection}</h3>

            {loading ? (
              <p className="text-sm text-rp-cinza-medio text-center py-8">Carregando...</p>
            ) : activeSection === 'Notificações' ? (
              <>
                <div className="space-y-1 mb-6">
                  {notifItems.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3.5 border-b border-rp-cinza-borda last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-rp-texto">{label}</p>
                        <p className="text-xs text-rp-cinza-medio">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotif((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notif[key] ? 'bg-rp-azul' : 'bg-rp-cinza-borda'}`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notif[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-rp-cinza-borda pt-5 mb-4">
                  <h4 className="text-sm font-bold text-rp-azul mb-4">Dados da empresa</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome fantasia</label>
                      <input
                        value={empresa.nome_fantasia}
                        onChange={(e) => setEmpresa((p) => ({ ...p, nome_fantasia: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail de contato</label>
                        <input
                          type="email"
                          value={empresa.email_contato}
                          onChange={(e) => setEmpresa((p) => ({ ...p, email_contato: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rp-texto mb-1.5">Telefone</label>
                        <input
                          value={empresa.telefone}
                          onChange={(e) => setEmpresa((p) => ({ ...p, telefone: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
                {saved && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-3">Configurações salvas com sucesso.</div>}

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSalvar}>
                    <Save size={13} /> Salvar preferências
                  </Button>
                </div>
              </>
            ) : activeSection === 'Segurança & Privacidade' ? (
              <div>
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-rp-azul mb-1">Trilha de auditoria</h4>
                  <p className="text-xs text-rp-cinza-medio">
                    Ultimas acoes administrativas registradas para compliance e rastreabilidade.
                  </p>
                </div>

                <div className="border border-rp-cinza-borda rounded-xl overflow-hidden">
                  {auditorias.length === 0 ? (
                    <div className="py-8 text-center text-sm text-rp-cinza-medio">
                      Nenhuma acao registrada ainda.
                    </div>
                  ) : (
                    auditorias.map((auditoria) => (
                      <div key={auditoria.id} className="px-4 py-3 border-b border-rp-cinza-borda last:border-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-rp-texto">
                              {auditoria.descricao || auditoria.acao}
                            </p>
                            <p className="text-xs text-rp-cinza-medio mt-0.5">
                              {auditoria.usuario?.nome ?? 'Sistema'} · {auditoria.acao}
                              {auditoria.entidade_tipo ? ` · ${auditoria.entidade_tipo} #${auditoria.entidade_id}` : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-rp-cinza-medio">{formatDate(auditoria.created_at)}</p>
                            {auditoria.ip && <p className="text-[10px] text-rp-cinza-medio mt-0.5">{auditoria.ip}</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeSection === 'Usuários & Permissões' ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-rp-azul mb-1">Canal de Escuta — Comitê externo</h4>
                  <p className="text-xs text-rp-cinza-medio mb-3">Destino seguro para denúncias que envolvem a Presidência. Esses relatos são enviados só para este e-mail e não ficam visíveis a nenhum usuário interno.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">E-mail do comitê/conselho</label>
                      <input type="email" value={comite.escuta_comite_email} onChange={(e) => setComite((c) => ({ ...c, escuta_comite_email: e.target.value }))} placeholder="comite@exemplo.com" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Nome / referência</label>
                      <input value={comite.escuta_comite_nome} onChange={(e) => setComite((c) => ({ ...c, escuta_comite_nome: e.target.value }))} placeholder="Ex: Conselho de Ética" className="input-field" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-3">
                    {comiteSaved && <span className="text-xs text-green-600 font-semibold">Salvo.</span>}
                    <Button variant="primary" size="sm" loading={comiteSaving} onClick={handleSalvarComite}><Save size={13} /> Salvar comitê</Button>
                  </div>
                </div>

                <div className="border-t border-rp-cinza-borda pt-5">
                  <h4 className="text-sm font-bold text-rp-azul mb-1">Grupos de tratamento</h4>
                  <p className="text-xs text-rp-cinza-medio mb-4">Defina quem trata as denúncias em cada nível. Só quem tem um grupo enxerga os relatos correspondentes — e nunca um relato em que a própria pessoa é a denunciada.</p>
                  <div className="space-y-2">
                    {usuarios.length === 0 && <p className="text-sm text-rp-cinza-medio text-center py-4">Nenhum usuário cadastrado.</p>}
                    {usuarios.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-rp-cinza-borda">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-rp-texto truncate">{u.nome}</p>
                          <p className="text-xs text-rp-cinza-medio truncate">{u.email} · {u.perfil}</p>
                        </div>
                        <select value={u.grupo_escuta ?? ''} onChange={(e) => handleGrupo(u.id, e.target.value)} className="text-sm border border-rp-cinza-borda rounded-lg px-2 py-1.5 text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30">
                          <option value="">Não trata escuta</option>
                          <option value="rh">RH</option>
                          <option value="diretoria">Diretoria</option>
                          <option value="presidencia">Presidência</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-rp-cinza-claro flex items-center justify-center mb-3">
                  {(() => {
                    const s = sections.find((s) => s.label === activeSection)
                    const Icon = s?.icon
                    return Icon ? <Icon size={20} className="text-rp-cinza-medio" /> : null
                  })()}
                </div>
                <p className="text-sm font-semibold text-rp-texto mb-1">{activeSection}</p>
                <p className="text-xs text-rp-cinza-medio">Esta seção estará disponível em breve.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
