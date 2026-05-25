import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Link2, Copy, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { nr1AdminService } from '../../services/nr1Service'

export default function Nr1Nova() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [aplicadaEm, setAplicadaEm] = useState('')
  const [expiraEm, setExpiraEm] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [criada, setCriada] = useState(null)
  const [copiado, setCopiado] = useState(false)

  function linkPublico(codigo) {
    return `${window.location.origin}/avaliacao/nr1/${codigo}`
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkPublico(criada.codigo))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Informe um título para a avaliação.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await nr1AdminService.criar({
        titulo: titulo.trim(),
        aplicada_em: aplicadaEm || undefined,
        expira_em: expiraEm || undefined,
        observacoes: observacoes || undefined,
      })
      setCriada(res.data)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao criar avaliação.')
    } finally {
      setLoading(false)
    }
  }

  async function publicar() {
    try {
      const res = await nr1AdminService.publicar(criada.id)
      setCriada(res.data)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao publicar.')
    }
  }

  if (criada) {
    const isAtiva = criada.status === 'ativa'
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-rp-texto mb-1">Avaliação criada!</h2>
          <p className="text-sm text-rp-cinza-medio mb-6">{criada.titulo}</p>

          <div className="bg-rp-cinza-claro rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-1">Código de acesso</p>
            <p className="font-mono text-2xl font-bold text-rp-azul tracking-widest">{criada.codigo}</p>
          </div>

          {isAtiva ? (
            <div className="mb-6">
              <p className="text-xs font-semibold text-rp-cinza-medio uppercase tracking-wide mb-2">Link para os colaboradores</p>
              <div className="flex items-center gap-2 bg-rp-cinza-claro rounded-lg p-3">
                <input
                  readOnly
                  value={linkPublico(criada.codigo)}
                  className="flex-1 bg-transparent text-xs text-rp-texto font-mono truncate outline-none"
                />
                <button
                  onClick={copiarLink}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rp-azul text-white rounded-lg text-xs font-semibold hover:bg-rp-azul/90 transition-colors"
                >
                  {copiado ? <CheckCircle size={12} /> : <Copy size={12} />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-rp-cinza-medio mt-2">
                Compartilhe este link com os colaboradores. Não é necessário login.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-rp-cinza-medio mb-3">
                A avaliação está em <strong>rascunho</strong>. Publique para liberar o link de acesso.
              </p>
              <Button variant="primary" onClick={publicar} className="w-full justify-center">
                Publicar agora
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/admin/nr1')} className="flex-1 justify-center">
              Ver todas as avaliações
            </Button>
            {isAtiva && (
              <Button variant="primary" onClick={() => navigate(`/admin/nr1/${criada.id}/resultados`)} className="flex-1 justify-center">
                Ver resultados
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <button
        onClick={() => navigate('/admin/nr1')}
        className="flex items-center gap-2 text-sm text-rp-cinza-medio hover:text-rp-texto mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para avaliações NR-1
      </button>

      <div className="bg-white rounded-xl shadow-card p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-rp-texto">Nova avaliação NR-1 / PGR</h2>
          <p className="text-sm text-rp-cinza-medio mt-1">
            Crie uma avaliação de riscos psicossociais com as 10 dimensões alinhadas à NR-1/PGR e ISO 45003:2021,
            conforme exigido pela Portaria MTE 1.419/2024.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">
              Título da avaliação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: PGR 2025 — 1º Semestre"
              className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2.5 text-sm text-rp-texto placeholder-rp-cinza-medio focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">
              Data de aplicação
            </label>
            <input
              type="date"
              value={aplicadaEm}
              onChange={(e) => setAplicadaEm(e.target.value)}
              className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2.5 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">
              Data de expiração <span className="text-rp-cinza-medio font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={expiraEm}
              onChange={(e) => setExpiraEm(e.target.value)}
              className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2.5 text-sm text-rp-texto focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul transition-colors"
            />
            <p className="text-xs text-rp-cinza-medio mt-1">
              O link público da avaliação ficará disponível até às 23:59:59 deste dia.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rp-texto mb-1.5">
              Observações <span className="text-rp-cinza-medio font-normal">(opcional)</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Contexto adicional, departamentos incluídos, período..."
              className="w-full border border-rp-cinza-borda rounded-lg px-3 py-2.5 text-sm text-rp-texto placeholder-rp-cinza-medio focus:outline-none focus:ring-2 focus:ring-rp-azul/30 focus:border-rp-azul transition-colors resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-rp-azul space-y-1">
            <p className="font-semibold">O que está incluído nesta avaliação:</p>
            <p>· 40 itens distribuídos em 10 dimensões psicossociais</p>
            <p>· Escala Likert de 1 a 5 (Discordo totalmente a Concordo totalmente)</p>
            <p>· Respondentes anônimos — conformidade LGPD</p>
            <p>· Relatório PDF para o PGR da empresa</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate('/admin/nr1')}
              className="flex-1 justify-center"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              className="flex-1 justify-center"
            >
              Criar avaliação
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
