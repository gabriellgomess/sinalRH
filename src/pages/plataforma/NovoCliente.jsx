import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService } from '../../services/plataformaService'

const planos = [
  { value: 'free',       label: 'Free',       desc: 'Até 50 colaboradores' },
  { value: 'starter',    label: 'Starter',    desc: 'Até 150 colaboradores' },
  { value: 'pleno',      label: 'Pleno',      desc: 'Até 500 colaboradores' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Sem limite' },
]

export default function NovoCliente() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [acesso, setAcesso] = useState(null)
  const [showSenha, setShowSenha] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    email_contato: '',
    telefone: '',
    plano: 'pleno',
    max_colaboradores: '',
    admin_nome: '',
    admin_email: '',
  })

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await plataformaEmpresaService.criar({
        ...form,
        max_colaboradores: form.max_colaboradores ? Number(form.max_colaboradores) : undefined,
      })
      setAcesso(res.acesso)
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Erro ao criar cliente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  if (acesso) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-card-hover overflow-hidden">
          <div className="px-6 py-5" style={{ backgroundColor: '#003366' }}>
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center mb-3">
              <Check size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Cliente criado com sucesso!</h2>
            <p className="text-white/70 text-sm mt-1">
              Compartilhe as credenciais abaixo com o administrador da empresa.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="bg-rp-cinza-claro rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">
                Dados de acesso
              </p>
              {[
                { label: 'URL de acesso', value: `${window.location.origin}/admin/login`, key: 'url' },
                { label: 'E-mail', value: acesso.email, key: 'email' },
                { label: 'Senha', value: acesso.senha, key: 'senha', secret: true },
              ].map(({ label, value, key, secret }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-rp-cinza-medio uppercase">{label}</p>
                    <p className="text-sm text-rp-texto font-medium truncate">
                      {secret && !showSenha ? '••••••••••••' : value}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {secret && (
                      <button
                        onClick={() => setShowSenha(!showSenha)}
                        className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-white transition-colors"
                      >
                        {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(value, key)}
                      className="p-1.5 rounded-lg text-rp-cinza-medio hover:text-rp-azul hover:bg-white transition-colors"
                    >
                      {copied === key ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-rp-cinza-medio text-center">
              Anote a senha agora — ela não será exibida novamente.
            </p>

            <div className="flex gap-2 pt-2">
              <Button variant="primary" fullWidth onClick={() => navigate('/plataforma/clientes')}>
                Ver todos os clientes
              </Button>
              <Button variant="outline" onClick={() => { setAcesso(null); setForm({ nome_fantasia: '', razao_social: '', cnpj: '', email_contato: '', telefone: '', plano: 'pleno', max_colaboradores: '', admin_nome: '', admin_email: '' }) }}>
                Novo
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/plataforma/clientes')}
          className="p-2 rounded-lg hover:bg-white border border-rp-cinza-borda text-rp-cinza-medio transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-rp-azul">Novo cliente</h1>
          <p className="text-sm text-rp-cinza-medio">Cadastre uma empresa e gere o primeiro acesso</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-rp-azul mb-4">Dados da empresa</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome fantasia *</label>
                <input value={form.nome_fantasia} onChange={(e) => set('nome_fantasia', e.target.value)} placeholder="Ex: Acme Brasil" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Razão social</label>
                <input value={form.razao_social} onChange={(e) => set('razao_social', e.target.value)} placeholder="Acme Brasil Ltda." className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">CNPJ</label>
                <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail de contato</label>
                <input type="email" value={form.email_contato} onChange={(e) => set('email_contato', e.target.value)} placeholder="rh@empresa.com.br" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Telefone</label>
                <input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 9 0000-0000" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-2">Plano *</label>
              <div className="grid grid-cols-2 gap-2">
                {planos.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('plano', p.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      form.plano === p.value
                        ? 'border-rp-azul bg-rp-azul-suave'
                        : 'border-rp-cinza-borda bg-white hover:border-rp-azul/40'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${form.plano === p.value ? 'text-rp-azul' : 'text-rp-texto'}`}>
                      {p.label}
                    </span>
                    <span className="text-xs text-rp-cinza-medio">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-1/2">
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Limite de colaboradores</label>
              <input type="number" value={form.max_colaboradores} onChange={(e) => set('max_colaboradores', e.target.value)} placeholder="100" className="input-field" min="1" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-rp-azul mb-1">Administrador da empresa</h3>
          <p className="text-xs text-rp-cinza-medio mb-4">Uma senha segura será gerada automaticamente.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome completo *</label>
              <input value={form.admin_nome} onChange={(e) => set('admin_nome', e.target.value)} placeholder="Ex: Marina Souza" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail *</label>
              <input type="email" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} placeholder="admin@empresa.com.br" className="input-field" required />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" loading={loading}>
            Criar cliente e gerar acesso
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/plataforma/clientes')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
