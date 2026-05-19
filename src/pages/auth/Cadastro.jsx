import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, Lock, X, Plus, Mail,
} from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

const PORTES = [
  { value: 'pequeno', label: '50 — 99',     sub: 'Plano Starter recomendado' },
  { value: 'medio',   label: '100 — 299',   sub: 'Plano Crescimento',         destaque: true },
  { value: 'grande',  label: '300 — 999',   sub: 'Plano Crescimento+' },
  { value: 'mega',    label: '1.000+',      sub: 'Plano Enterprise' },
]

const SETORES_SUGERIDOS = ['Comercial', 'Engenharia', 'Operações', 'Marketing', 'TI', 'Financeiro', 'RH', 'Atendimento']

function StepIndicator({ passo, total = 3, labels }) {
  return (
    <div className="hidden md:flex items-center gap-3 mb-8">
      {labels.map((lab, i) => {
        const n = i + 1
        const ativo = passo === n
        const completo = passo > n
        return (
          <div key={n} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              completo ? 'bg-green-500 text-white'
              : ativo ? 'bg-rp-laranja text-white'
              : 'bg-rp-cinza-borda text-rp-cinza-medio'
            }`}>
              {completo ? <CheckCircle size={14} /> : n}
            </div>
            <div className="hidden lg:block">
              <p className={`text-xs font-bold ${ativo ? 'text-rp-texto' : 'text-rp-cinza-medio'}`}>{lab.titulo}</p>
              <p className="text-[10px] text-rp-cinza-medio">{lab.sub}</p>
            </div>
            {n < total && <div className={`hidden lg:block h-0.5 w-10 ${completo ? 'bg-green-500' : 'bg-rp-cinza-borda'}`} />}
          </div>
        )
      })}
    </div>
  )
}

function PainelLateral({ passo, form, setoresCriados, convitesEnviados }) {
  const titulos = {
    1: { tag: 'Por que começar hoje', titulo: 'Em 5 minutos, sua empresa já está escutando.' },
    2: { tag: 'Prévia do seu painel', titulo: 'É assim que sua empresa vai aparecer aqui.' },
    3: { tag: 'Quase lá', titulo: 'Convide quem vai responder o primeiro check-in.' },
  }
  const t = titulos[passo] ?? titulos[1]

  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #003366 0%, #002244 100%)' }}
    >
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute inset-0 border-2 border-white rounded-full" style={{
            width: `${i * 120}px`, height: `${i * 120}px`,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          }} />
        ))}
      </div>

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rp-laranja mb-3">{t.tag}</p>
        <h2 className="text-2xl font-bold leading-snug mb-3">{t.titulo}</h2>
        <p className="text-white/60 text-sm">
          {passo === 1 && 'Setup acompanhado, sem instalação. O primeiro check-in vai pro time hoje mesmo, se você quiser.'}
          {passo === 2 && 'Personalizamos o painel com base no porte e nos setores que importam pra você.'}
          {passo === 3 && 'Você pode pular essa etapa e convidar depois — mas começar com gente já dentro acelera tudo.'}
        </p>
      </div>

      {/* Preview por passo */}
      <div className="relative">
        {passo === 1 && (
          <div className="space-y-3">
            {[
              ['01', 'Crie sua conta com seu e-mail corporativo'],
              ['02', 'Configure porte e setores principais'],
              ['03', 'Convide o time e dispare o primeiro check-in'],
            ].map(([n, t]) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-rp-laranja w-5">{n}</span>
                <span className="text-sm text-white/80">{t}</span>
              </div>
            ))}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rp-laranja/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">SL</span>
                </div>
                <div>
                  <p className="text-xs font-bold">Sara Linhar</p>
                  <p className="text-[10px] text-white/50">Consultora · Fundadora</p>
                  <p className="text-xs text-white/80 italic mt-1">
                    "O setup é guiado. Você pode pular qualquer passo e voltar
                    quando quiser — nada trava sua entrada."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold">Mapa de setores</p>
              <span className="text-[10px] text-white/50">preview</span>
            </div>
            <div className="space-y-2.5">
              {form.setores.length > 0 ? form.setores.slice(0, 5).map((s) => (
                <div key={s} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span>{s}</span>
                  </div>
                  <span className="text-white/40">aguardando</span>
                </div>
              )) : (
                <p className="text-xs text-white/40 italic">Adicione setores para ver a prévia.</p>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[10px] text-rp-laranja font-bold uppercase tracking-wide mb-1">Dica do setup</p>
              <p className="text-xs text-white/70">Comece com 3 a 6 setores. Dá pra criar mais depois, conforme o time crescer.</p>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={14} className="text-rp-laranja" />
              <p className="text-xs font-bold">Resumo dos convites</p>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Setores criados</span>
                <span className="font-bold">{setoresCriados}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Convites prontos</span>
                <span className="font-bold">{convitesEnviados}</span>
              </div>
            </div>
            <p className="text-[10px] text-white/50">
              Cada pessoa recebe um e-mail com link seguro para criar a senha. O link expira em 14 dias.
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/30 relative">
        © {new Date().getFullYear()} SinalRH · Uma iniciativa Sara Linhar Consultoria
      </p>
    </div>
  )
}

export default function Cadastro() {
  const navigate = useNavigate()
  const { loginAdmin } = useAuth()

  const [passo, setPasso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [contaCriada, setContaCriada] = useState(false)
  const [setoresCriados, setSetoresCriados] = useState(0)

  const [form, setForm] = useState({
    admin_nome: '',
    admin_cargo: '',
    admin_telefone: '',
    admin_email: '',
    admin_senha: '',
    admin_senha_confirmation: '',
    aceitouTermos: false,

    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    porte: 'medio',
    setores: ['Comercial', 'Engenharia', 'Operações', 'Marketing', 'TI'],
    novoSetor: '',
    segmento: '',
    modelo_trabalho: 'hibrido',
  })

  const [convites, setConvites] = useState([{ nome: '', email: '' }])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function adicionarSetor() {
    const s = form.novoSetor.trim()
    if (!s || form.setores.includes(s)) return
    set('setores', [...form.setores, s])
    set('novoSetor', '')
  }
  function removerSetor(s) { set('setores', form.setores.filter(x => x !== s)) }

  function adicionarConvite() { setConvites(prev => [...prev, { nome: '', email: '' }]) }
  function removerConvite(i)  { setConvites(prev => prev.filter((_, idx) => idx !== i)) }
  function alterarConvite(i, campo, valor) {
    setConvites(prev => prev.map((c, idx) => idx === i ? { ...c, [campo]: valor } : c))
  }

  function validarPasso1() {
    if (!form.admin_nome.trim() || !form.admin_email.trim()) {
      setErro('Nome e e-mail são obrigatórios.')
      return false
    }
    if (form.admin_senha.length < 10) {
      setErro('Senha deve ter no mínimo 10 caracteres com número e símbolo.')
      return false
    }
    if (!form.aceitouTermos) {
      setErro('Você precisa aceitar os termos e a política de privacidade.')
      return false
    }
    setErro('')
    return true
  }

  function validarPasso2() {
    if (!form.nome_fantasia.trim()) {
      setErro('Razão social ou nome da empresa é obrigatório.')
      return false
    }
    if (form.setores.length < 3) {
      setErro('Cadastre pelo menos 3 setores para começar.')
      return false
    }
    setErro('')
    return true
  }

  async function avancarDe1Para2() {
    if (!validarPasso1()) return
    setLoading(true)
    setErro('')
    try {
      const data = await authService.cadastrarEmpresa({
        nome_fantasia: form.admin_nome.split(' ')[0] + ' Workspace', // temporario, atualizado no passo 2
        admin_nome:    form.admin_nome.trim(),
        admin_email:   form.admin_email.trim(),
        admin_senha:   form.admin_senha,
        admin_senha_confirmation: form.admin_senha_confirmation || form.admin_senha,
      })
      loginAdmin._afterCadastro(data)
      setContaCriada(true)
      setPasso(2)
    } catch (err) {
      const errors = err.response?.data?.errors
      setErro(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message || 'Erro ao criar a conta.'))
    } finally {
      setLoading(false)
    }
  }

  async function avancarDe2Para3() {
    if (!validarPasso2()) return
    setLoading(true)
    setErro('')
    try {
      const res = await authService.cadastrarSetoresOnboarding(form.setores)
      setSetoresCriados(res.data?.total ?? form.setores.length)
      setPasso(3)
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao salvar setores.')
    } finally {
      setLoading(false)
    }
  }

  async function finalizar() {
    const convitesValidos = convites.filter(c => c.nome.trim() && c.email.trim())
    setLoading(true)
    setErro('')
    try {
      if (convitesValidos.length > 0) {
        await authService.enviarConvitesOnboarding(convitesValidos)
      }
      await authService.concluirOnboarding()
      navigate('/admin/dashboard')
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao enviar convites.')
    } finally {
      setLoading(false)
    }
  }

  async function pularConvites() {
    setLoading(true)
    try {
      await authService.concluirOnboarding()
      navigate('/admin/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const labelsSteps = [
    { titulo: 'Sua conta',    sub: 'identificação' },
    { titulo: 'Sua empresa',  sub: 'porte & setores' },
    { titulo: 'Convide o time', sub: 'primeiro check-in' },
  ]
  const convitesValidos = convites.filter(c => c.nome.trim() && c.email.trim()).length

  return (
    <div className="min-h-screen flex bg-rp-cinza-claro">
      <PainelLateral passo={passo} form={form} setoresCriados={setoresCriados} convitesEnviados={convitesValidos} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-rp-cinza-borda">
          <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/assets/imagens/logo_horizontal.png" alt="SinalRH" className="h-7" />
            </Link>
            <StepIndicator passo={passo} labels={labelsSteps} />
            <div className="flex items-center gap-2 text-xs text-rp-cinza-medio">
              <Lock size={12} />
              <span>Conexão segura · LGPD</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 py-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto">

            {/* ── PASSO 1: Conta ── */}
            {passo === 1 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rp-cinza-medio mb-3">Passo 1 de 3</p>
                <h1 className="text-3xl font-bold mb-2">Vamos começar pelo <span className="text-rp-laranja">básico</span>.</h1>
                <p className="text-sm text-rp-cinza-medio mb-8">Crie sua conta de administrador. Você poderá adicionar outros gestores depois.</p>

                <div className="bg-white rounded-2xl shadow-card p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Seu nome *</label>
                      <input value={form.admin_nome} onChange={e => set('admin_nome', e.target.value)} placeholder="Ex: Marina Costa" className="input-field" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Cargo</label>
                      <input value={form.admin_cargo} onChange={e => set('admin_cargo', e.target.value)} placeholder="Ex: Diretora de RH" className="input-field" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">E-mail corporativo *</label>
                      <input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="marina@suaempresa.com.br" className="input-field" />
                      <p className="text-[10px] text-rp-cinza-medio mt-1">Vamos enviar um link de confirmação.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Telefone (WhatsApp) <span className="normal-case font-normal">opcional</span></label>
                      <input value={form.admin_telefone} onChange={e => set('admin_telefone', e.target.value)} placeholder="(11) 9 0000-0000" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Senha *</label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={form.admin_senha}
                        onChange={e => { set('admin_senha', e.target.value); set('admin_senha_confirmation', e.target.value) }}
                        placeholder="Mínimo 10 caracteres"
                        className="input-field pr-10"
                      />
                      <button type="button" onClick={() => setMostrarSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio">
                        {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-rp-cinza-medio mt-1">Min. 10 caracteres com número e símbolo.</p>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-rp-texto cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.aceitouTermos}
                      onChange={e => set('aceitouTermos', e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Li e concordo com os <a className="text-rp-azul font-semibold underline">Termos de uso</a> e a{' '}
                      <a className="text-rp-azul font-semibold underline">Política de privacidade</a>.
                      O SinalRH segue rigorosamente a LGPD.
                    </span>
                  </label>

                  {erro && <p className="text-xs text-red-600">{erro}</p>}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Link to="/" className="text-xs text-rp-cinza-medio hover:text-rp-texto">— Voltar ao site</Link>
                  <button
                    onClick={avancarDe1Para2}
                    disabled={loading}
                    className="flex items-center gap-2 bg-rp-azul-profundo hover:bg-rp-azul text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                    style={{ background: '#002244' }}
                  >
                    {loading ? 'Criando conta...' : 'Continuar'} <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* ── PASSO 2: Empresa ── */}
            {passo === 2 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rp-cinza-medio mb-3">Passo 2 de 3</p>
                <h1 className="text-3xl font-bold mb-2">Conte sobre a <span className="text-rp-laranja">sua empresa</span>.</h1>
                <p className="text-sm text-rp-cinza-medio mb-8">Personalizamos o painel com base no porte e nos setores que importam pra você.</p>

                <div className="bg-white rounded-2xl shadow-card p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Razão social *</label>
                      <input value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} placeholder="Ex: Granaria Foods Ltda." className="input-field" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">CNPJ</label>
                      <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-2">Porte da empresa *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {PORTES.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => set('porte', p.value)}
                          className={`text-left rounded-xl border p-3 transition-colors ${form.porte === p.value ? 'border-rp-laranja bg-orange-50' : 'border-rp-cinza-borda hover:border-rp-azul/40'}`}
                        >
                          <p className="text-xs font-bold text-rp-texto">{p.label}</p>
                          <p className="text-[10px] text-rp-cinza-medio mt-0.5">{p.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">
                      Setores principais <span className="normal-case font-normal">adicione 3 a 6 para começar</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.setores.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-orange-50 text-rp-laranja text-xs font-semibold px-2.5 py-1 rounded-full">
                          {s}
                          <button onClick={() => removerSetor(s)} className="hover:text-red-600"><X size={11} /></button>
                        </span>
                      ))}
                      <div className="inline-flex items-center gap-1">
                        <input
                          value={form.novoSetor}
                          onChange={e => set('novoSetor', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarSetor())}
                          placeholder="+ Adicionar setor"
                          className="text-xs px-2 py-1 border border-rp-cinza-borda rounded-full focus:outline-none focus:ring-1 focus:ring-rp-azul/30"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-rp-cinza-medio">
                      Sugestões: {SETORES_SUGERIDOS.filter(s => !form.setores.includes(s)).slice(0, 5).map((s, i, arr) => (
                        <button
                          key={s}
                          onClick={() => set('setores', [...form.setores, s])}
                          className="text-rp-azul hover:underline"
                        >
                          {s}{i < arr.length - 1 ? ', ' : ''}
                        </button>
                      ))}
                    </p>
                    <p className="text-[10px] text-rp-cinza-medio mt-2">Você pode editar isso a qualquer momento no painel admin.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Setor de atuação</label>
                      <select value={form.segmento} onChange={e => set('segmento', e.target.value)} className="input-field">
                        <option value="">Selecione...</option>
                        <option>Indústria de alimentos</option>
                        <option>Tecnologia</option>
                        <option>Varejo</option>
                        <option>Serviços</option>
                        <option>Saúde</option>
                        <option>Educação</option>
                        <option>Logística</option>
                        <option>Construção</option>
                        <option>Financeiro</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1.5">Modelo de trabalho</label>
                      <select value={form.modelo_trabalho} onChange={e => set('modelo_trabalho', e.target.value)} className="input-field">
                        <option value="presencial">Presencial</option>
                        <option value="hibrido">Híbrido (presencial + remoto)</option>
                        <option value="remoto">100% remoto</option>
                      </select>
                    </div>
                  </div>

                  {erro && <p className="text-xs text-red-600">{erro}</p>}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button onClick={() => setPasso(1)} className="flex items-center gap-1 text-xs text-rp-cinza-medio hover:text-rp-texto">
                    <ArrowLeft size={12} /> Voltar
                  </button>
                  <div className="flex gap-2">
                    <button onClick={pularConvites} className="text-xs text-rp-cinza-medio hover:text-rp-texto px-4 py-2.5">
                      Salvar e sair
                    </button>
                    <button
                      onClick={avancarDe2Para3}
                      disabled={loading}
                      className="flex items-center gap-2 bg-rp-azul-profundo hover:bg-rp-azul text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                      style={{ background: '#002244' }}
                    >
                      {loading ? 'Salvando...' : 'Continuar'} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── PASSO 3: Convites ── */}
            {passo === 3 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rp-cinza-medio mb-3">Passo 3 de 3</p>
                <h1 className="text-3xl font-bold mb-2">Convide o <span className="text-rp-laranja">primeiro time</span>.</h1>
                <p className="text-sm text-rp-cinza-medio mb-8">
                  Cada pessoa recebe um e-mail com link seguro para criar a senha.
                  Você pode pular e fazer isso depois.
                </p>

                <div className="bg-white rounded-2xl shadow-card p-8">
                  <div className="space-y-3 mb-4">
                    {convites.map((c, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          value={c.nome}
                          onChange={e => alterarConvite(i, 'nome', e.target.value)}
                          placeholder="Nome completo"
                          className="input-field text-sm"
                        />
                        <input
                          type="email"
                          value={c.email}
                          onChange={e => alterarConvite(i, 'email', e.target.value)}
                          placeholder="email@empresa.com.br"
                          className="input-field text-sm"
                        />
                        <button
                          onClick={() => removerConvite(i)}
                          disabled={convites.length === 1}
                          className="px-3 text-rp-cinza-medio hover:text-red-500 disabled:opacity-30"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={adicionarConvite}
                    className="flex items-center gap-1.5 text-xs font-bold text-rp-azul hover:text-rp-azul-profundo"
                  >
                    <Plus size={13} /> Adicionar mais um
                  </button>

                  <div className="mt-6 pt-5 border-t border-rp-cinza-borda flex items-center justify-between">
                    <p className="text-xs text-rp-cinza-medio">
                      {convitesValidos > 0
                        ? `${convitesValidos} convite${convitesValidos > 1 ? 's' : ''} pronto${convitesValidos > 1 ? 's' : ''} para envio.`
                        : 'Preencha pelo menos 1 convite ou pule esta etapa.'}
                    </p>
                  </div>

                  {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button onClick={() => setPasso(2)} className="flex items-center gap-1 text-xs text-rp-cinza-medio hover:text-rp-texto">
                    <ArrowLeft size={12} /> Voltar
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={pularConvites}
                      disabled={loading}
                      className="text-xs text-rp-cinza-medio hover:text-rp-texto px-4 py-2.5 disabled:opacity-50"
                    >
                      Pular e ir para o painel
                    </button>
                    <button
                      onClick={finalizar}
                      disabled={loading}
                      className="flex items-center gap-2 bg-rp-laranja hover:bg-rp-laranja/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Enviando...' : (convitesValidos > 0 ? `Disparar ${convitesValidos} convite${convitesValidos > 1 ? 's' : ''}` : 'Finalizar')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
