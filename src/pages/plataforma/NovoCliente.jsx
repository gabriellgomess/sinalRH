import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Eye, EyeOff, Package } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService } from '../../services/plataformaService'

const PRODUTOS_CATALOGO = {
  nenhum:          { titulo: 'Apenas criar conta básica (Sem produto inicial)', tipoSugerido: 'pontual' },
  diagnostico_nr1: { titulo: 'Diagnóstico Psicossocial NR-1 (Recomendado)', tipoSugerido: 'pontual', valorUnitario: '30', limiteColab: '50', quantidadeAplicacoes: '2' },
  plano_acao_nr1:  { titulo: 'Plano de Ação Continuado NR-1', tipoSugerido: 'recorrente_mensal', valorUnitario: '30', limiteColab: '50', valorMensal: '1500' },
  mapa_riscos:     { titulo: 'Mapa de Riscos',              tipoSugerido: 'recorrente_mensal', valorUnitario: '30', limiteColab: '50', valorMensal: '1500' },
  pesquisas:       { titulo: 'Pesquisas e Clima',           tipoSugerido: 'recorrente_mensal', valorUnitario: '30', limiteColab: '50', valorMensal: '1500' },
  canal_escuta:    { titulo: 'Canal de Escuta Profissional',  tipoSugerido: 'recorrente_mensal', valorUnitario: '30', limiteColab: '50', valorMensal: '1500' },
}

export default function NovoCliente() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [acesso, setAcesso] = useState(null)
  const [showSenha, setShowSenha] = useState(false)
  const [showFormSenha, setShowFormSenha] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    email_contato: '',
    telefone: '',
    contratar_produto: 'diagnostico_nr1',
    produto_tipo: 'pontual',
    produto_valor_unitario: '30',
    produto_valor_mensal: '',
    produto_quantidade_aplicacoes: '2',
    produto_limite_colaboradores: '50',
    produto_data_inicio: new Date().toISOString().substring(0, 10),
    produto_observacoes: '',
    admin_nome: '',
    admin_email: '',
    admin_senha: '',
  })

  function set(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'contratar_produto') {
        const prod = PRODUTOS_CATALOGO[value]
        if (prod) {
          next.produto_tipo = prod.tipoSugerido
          next.produto_valor_unitario = prod.valorUnitario ?? '30'
          next.produto_limite_colaboradores = prod.limiteColab ?? '50'
          next.produto_quantidade_aplicacoes = prod.quantidadeAplicacoes ?? ''
          next.produto_valor_mensal = prod.valorMensal ?? ''
          
          if (prod.tipoSugerido === 'recorrente_mensal') {
            const limit = Number(next.produto_limite_colaboradores) || 0
            const unit = Number(next.produto_valor_unitario) || 0
            if (limit && unit) {
              next.produto_valor_mensal = String(limit * unit)
            }
          }
        }
      }
      
      if (next.produto_tipo === 'recorrente_mensal') {
        if (field === 'produto_limite_colaboradores' || field === 'produto_valor_unitario' || field === 'produto_tipo') {
          const limit = Number(next.produto_limite_colaboradores) || 0
          const unit = Number(next.produto_valor_unitario) || 0
          if (limit && unit) {
            next.produto_valor_mensal = String(limit * unit)
          }
        }
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        nome_fantasia: form.nome_fantasia,
        razao_social: form.razao_social,
        cnpj: form.cnpj,
        email_contato: form.email_contato,
        telefone: form.telefone,
        admin_nome: form.admin_nome,
        admin_email: form.admin_email,
        admin_senha: form.admin_senha,
        plano: 'pleno',
      }

      if (form.contratar_produto && form.contratar_produto !== 'nenhum') {
        payload.contratar_produto = form.contratar_produto
        payload.produto_tipo = form.produto_tipo
        payload.produto_valor_unitario = form.produto_valor_unitario ? Number(form.produto_valor_unitario) : null
        payload.produto_valor_mensal = form.produto_valor_mensal ? Number(form.produto_valor_mensal) : null
        payload.produto_quantidade_aplicacoes = form.produto_quantidade_aplicacoes ? Number(form.produto_quantidade_aplicacoes) : null
        payload.produto_limite_colaboradores = form.produto_limite_colaboradores ? Number(form.produto_limite_colaboradores) : null
        payload.produto_data_inicio = form.produto_data_inicio
        payload.produto_observacoes = form.produto_observacoes
      }

      const res = await plataformaEmpresaService.criar(payload)
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
              <Button variant="outline" onClick={() => { setAcesso(null); setShowFormSenha(false); setForm({ nome_fantasia: '', razao_social: '', cnpj: '', email_contato: '', telefone: '', contratar_produto: 'diagnostico_nr1', produto_tipo: 'pontual', produto_valor_unitario: '30', produto_valor_mensal: '', produto_quantidade_aplicacoes: '2', produto_limite_colaboradores: '50', produto_data_inicio: new Date().toISOString().substring(0, 10), produto_observacoes: '', admin_nome: '', admin_email: '', admin_senha: '' }) }}>
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

            {/* Contratação de Produto Inicial */}
            <div className="border-t border-rp-cinza-borda pt-4">
              <label className="block text-sm font-bold text-rp-azul mb-3 flex items-center gap-2">
                <Package size={16} /> Contrato & Serviço Inicial
              </label>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-rp-texto mb-1.5 uppercase tracking-wide">Escolha o produto principal</label>
                  <select
                    value={form.contratar_produto}
                    onChange={(e) => set('contratar_produto', e.target.value)}
                    className="w-full border border-rp-cinza-borda rounded-xl px-4 py-3 text-sm text-rp-texto bg-white focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul"
                  >
                    {Object.entries(PRODUTOS_CATALOGO).map(([key, p]) => (
                      <option key={key} value={key}>{p.titulo}</option>
                    ))}
                  </select>
                </div>

                {form.contratar_produto !== 'nenhum' && (
                  <div className="bg-rp-cinza-claro/50 border border-rp-cinza-borda rounded-2xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rp-azul animate-pulse" />
                      <span className="text-xs font-bold text-rp-azul uppercase tracking-wider">
                        Configurações do Contrato ({form.produto_tipo === 'pontual' ? 'Cobrança Única' : 'Mensal Recorrente'})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Pacote de Colaboradores</label>
                        <select
                          value={['10', '20', '50', '100', '300', '500'].includes(String(form.produto_limite_colaboradores)) ? String(form.produto_limite_colaboradores) : 'custom'}
                          onChange={e => {
                            const val = e.target.value
                            if (val === 'custom') {
                              set('produto_limite_colaboradores', '150')
                            } else {
                              set('produto_limite_colaboradores', val)
                            }
                          }}
                          className="input-field text-sm"
                        >
                          <option value="10">📦 10 colaboradores</option>
                          <option value="20">📦 20 colaboradores</option>
                          <option value="50">📦 50 colaboradores</option>
                          <option value="100">📦 100 colaboradores</option>
                          <option value="300">📦 300 colaboradores</option>
                          <option value="500">📦 500 colaboradores</option>
                          <option value="custom">✍️ Personalizado...</option>
                        </select>
                      </div>

                      {!['10', '20', '50', '100', '300', '500'].includes(String(form.produto_limite_colaboradores)) && (
                        <div>
                          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Nº de Colaboradores</label>
                          <input
                            type="number"
                            min="1"
                            value={form.produto_limite_colaboradores || ''}
                            onChange={e => set('produto_limite_colaboradores', e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {form.produto_tipo === 'pontual' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por colaborador (R$)</label>
                          <input type="number" step="0.01" value={form.produto_valor_unitario} onChange={e => set('produto_valor_unitario', e.target.value)} className="input-field text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Aplicações/ano</label>
                          <input type="number" min="1" max="12" value={form.produto_quantidade_aplicacoes} onChange={e => set('produto_quantidade_aplicacoes', e.target.value)} className="input-field text-sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor por colaborador (R$)</label>
                          <input type="number" step="0.01" value={form.produto_valor_unitario} onChange={e => set('produto_valor_unitario', e.target.value)} className="input-field text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Valor mensal (R$)</label>
                          <input type="number" step="0.01" value={form.produto_valor_mensal} onChange={e => set('produto_valor_mensal', e.target.value)} placeholder="Auto-calculado ou override" className="input-field text-sm" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Data de início</label>
                        <input type="date" value={form.produto_data_inicio} onChange={e => set('produto_data_inicio', e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Nº do Contrato</label>
                        <input value="Gerado automaticamente..." disabled className="input-field text-sm bg-rp-cinza-claro text-rp-cinza-medio cursor-not-allowed" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-rp-cinza-medio uppercase tracking-wide mb-1.5 font-semibold">Observações do Contrato</label>
                      <textarea rows={2} value={form.produto_observacoes} onChange={e => set('produto_observacoes', e.target.value)} placeholder="Notas internas sobre este contrato..." className="input-field text-sm resize-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-rp-azul mb-1">Administrador da empresa</h3>
          <p className="text-xs text-rp-cinza-medio mb-4">Se não informar uma senha, uma senha segura será gerada automaticamente.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Nome completo *</label>
              <input value={form.admin_nome} onChange={(e) => set('admin_nome', e.target.value)} placeholder="Ex: Marina Souza" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail *</label>
              <input type="email" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} placeholder="admin@empresa.com.br" className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Senha do Administrador</label>
              <div className="relative">
                <input
                  type={showFormSenha ? 'text' : 'password'}
                  value={form.admin_senha}
                  onChange={(e) => set('admin_senha', e.target.value)}
                  placeholder="Deixe em branco para gerar automaticamente (mín. 8 caracteres)"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowFormSenha(!showFormSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio hover:text-rp-azul transition-colors"
                >
                  {showFormSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
