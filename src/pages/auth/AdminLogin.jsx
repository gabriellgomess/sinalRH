import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SinalLogo } from '../../components/layout/SinalLogo'

export default function AdminLogin() {
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginAdmin(email, senha)
    setLoading(false)
    if (result.success) navigate(result.tipo === 'super_admin' ? '/plataforma' : '/admin/dashboard')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-rp-cinza-claro flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card-hover overflow-hidden relative">
          <div className="absolute left-6 top-6 z-10">
            <Link 
              to="/" 
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-all bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-medium"
            >
              <ArrowLeft size={13} />
              Voltar ao site
            </Link>
          </div>

          <div className="px-8 py-8 flex flex-col items-center" style={{ backgroundColor: '#003366' }}>
            <SinalLogo size="md" dark />
            <p className="text-white/70 text-sm mt-3">Painel administrativo</p>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-xl font-bold text-rp-azul mb-1">Bem-vinda de volta</h2>
            <p className="text-sm text-rp-cinza-medio mb-6">Acesse sua conta para gerenciar o Sinal RH</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  className="input-field"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pr-12"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio p-1"
                  >
                    {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary min-h-[46px] text-base mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-rp-cinza-medio">
              <Shield size={11} />
              <span>Acesso restrito a usuários autorizados</span>
            </div>

            <div className="mt-6 pt-4 border-t border-rp-cinza-borda flex items-center justify-center">
              <Link to="/login" className="text-sm text-rp-azul font-medium hover:underline">
                ← Área do empregado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
