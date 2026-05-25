import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { RadarLogo } from '../../components/layout/RadarLogo'

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
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto relative">
      <div className="absolute left-6 top-6">
        <Link 
          to="/" 
          className="text-xs text-rp-cinza-medio hover:text-rp-azul flex items-center gap-1 transition-all bg-rp-cinza-claro/50 hover:bg-rp-cinza-claro px-3 py-1.5 rounded-full font-medium"
        >
          <ArrowLeft size={13} />
          Voltar ao site
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-20 pb-8">
        <div className="flex justify-center mb-10">
          <RadarLogo size="lg" />
        </div>

        <div className="bg-rp-azul-suave rounded-xl px-4 py-3.5 mb-8 text-center">
          <p className="text-sm text-rp-azul font-medium italic">
            "Sua voz ajuda a construir ambientes de trabalho mais saudáveis."
          </p>
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

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-rp-cinza-medio">
          <Lock size={11} />
          <span>Acesso seguro · dados em conformidade com a LGPD</span>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-xs text-rp-cinza-medio mb-1">É administrador?</p>
          <Link to="/admin/login" className="text-sm text-rp-azul font-semibold hover:underline">
            Acessar painel administrativo
          </Link>
        </div>
      </div>
    </div>
  )
}
