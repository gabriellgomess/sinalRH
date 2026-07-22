import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SinalLogo } from '../../components/layout/SinalLogo'

export default function Login() {
  const { loginColaborador } = useAuth()
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
    const result = await loginColaborador(email, senha)
    setLoading(false)
    if (result.success) navigate('/app')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Painel de marca — somente desktop */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative"
        style={{ background: 'linear-gradient(135deg, #003366 0%, #002244 100%)' }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-medium w-fit transition-all"
        >
          <ArrowLeft size={13} /> Voltar ao site
        </Link>

        <div className="max-w-sm">
          <SinalLogo size="lg" dark />
          <p className="mt-8 text-2xl font-bold leading-snug">
            Um espaço seguro para você dividir como está se sentindo no trabalho.
          </p>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            Sua voz ajuda a construir ambientes de trabalho mais saudáveis.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <Lock size={12} />
          <span>Acesso seguro · dados em conformidade com a LGPD</span>
        </div>
      </div>

      {/* Coluna do formulário */}
      <div className="min-h-screen lg:min-h-0 flex flex-col px-6 pt-20 pb-8 lg:justify-center lg:px-14 relative">
        {/* Voltar ao site — somente mobile */}
        <div className="absolute left-6 top-6 lg:hidden">
          <Link
            to="/"
            className="text-xs text-rp-cinza-medio hover:text-rp-azul flex items-center gap-1 transition-all bg-rp-cinza-claro/50 hover:bg-rp-cinza-claro px-3 py-1.5 rounded-full font-medium"
          >
            <ArrowLeft size={13} /> Voltar ao site
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Logo + frase — somente mobile (no desktop ficam no painel de marca) */}
          <div className="lg:hidden">
            <div className="flex justify-center mb-10">
              <SinalLogo size="lg" />
            </div>
            <div className="bg-rp-azul-suave rounded-xl px-4 py-3.5 mb-8 text-center">
              <p className="text-sm text-rp-azul font-medium italic">
                "Sua voz ajuda a construir ambientes de trabalho mais saudáveis."
              </p>
            </div>
          </div>

          {/* Título — somente desktop */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-rp-azul">Acesse sua conta</h1>
            <p className="text-sm text-rp-cinza-medio mt-1">Entre para acompanhar pesquisas, cursos e comunicados.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">
                E-mail, CPF ou código de acesso
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="input-field"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-rp-texto">Senha</label>
                <button type="button" className="text-sm text-rp-azul font-medium hover:underline">
                  Esqueci minha senha
                </button>
              </div>
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
              className="btn-primary-mobile mt-2"
              style={{ backgroundColor: '#e67e22' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-rp-cinza-medio lg:hidden">
            <Lock size={11} />
            <span>Acesso seguro · dados em conformidade com a LGPD</span>
          </div>

          <div className="mt-10 pt-6 border-t border-rp-cinza-borda text-center">
            <p className="text-xs text-rp-cinza-medio mb-1">É administrador?</p>
            <Link to="/admin/login" className="text-sm text-rp-azul font-semibold hover:underline">
              Acessar painel administrativo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
