import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { RadarLogo } from '../../components/layout/RadarLogo'
import { authService } from '../../services/authService'

export default function ConviteColaborador() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [convite, setConvite] = useState(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    authService.validarConviteColaborador(token)
      .then(setConvite)
      .catch(() => setError('Convite invalido ou expirado. Solicite um novo convite ao RH.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (senha !== confirmacao) {
      setError('As senhas nao conferem.')
      return
    }

    setSaving(true)
    try {
      await authService.aceitarConviteColaborador(token, senha, confirmacao)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message
      setError(msg || 'Erro ao definir senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto">
      <div className="flex-1 flex flex-col px-6 pt-16 pb-8">
        <div className="flex justify-center mb-10">
          <RadarLogo size="lg" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-rp-azul mb-2">Definir senha</h1>
          <p className="text-sm text-rp-cinza-medio">
            {convite ? `${convite.nome} - ${convite.empresa}` : 'Validando convite...'}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-rp-cinza-medio">Carregando...</p>
        ) : error && !convite ? (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">{error}</div>
            <Link to="/login" className="btn-primary-mobile text-center" style={{ backgroundColor: '#e67e22' }}>
              Voltar ao login
            </Link>
          </div>
        ) : success ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg font-medium">
            Senha definida. Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="input-field pr-12"
                  minLength={6}
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

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Confirmar senha</label>
              <input
                type={showSenha ? 'text' : 'password'}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="Repita a senha"
                className="input-field"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary-mobile mt-2"
              style={{ backgroundColor: '#e67e22' }}
            >
              {saving ? 'Salvando...' : 'Definir senha'}
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-rp-cinza-medio">
          <Lock size={11} />
          <span>Acesso seguro - dados em conformidade com a LGPD</span>
        </div>
      </div>
    </div>
  )
}
