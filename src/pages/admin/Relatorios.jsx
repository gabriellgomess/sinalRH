import { useState, useEffect } from 'react'
import { Download, Send, Copy, Sparkles, CheckCircle, AlertTriangle, Filter, Briefcase, FileText, X } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { relatorioService } from '../../services/adminService'
import { formatDate } from '../../utils/formatters'

function EnviarModal({ relatorioId, onClose }) {
  const [emails, setEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleEnviar() {
    const lista = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
    if (lista.length === 0) { setError('Informe pelo menos um e-mail.'); return }
    setSending(true)
    setError('')
    try {
      await relatorioService.enviarEmail(relatorioId, lista)
      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <h2 className="text-base font-bold text-rp-azul">Enviar para diretoria</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rp-texto">Relatório enviado com sucesso!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">
                  E-mails dos destinatários
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="ceo@empresa.com.br, diretoria@empresa.com.br"
                  rows={3}
                  className="input-field resize-none"
                  autoFocus
                />
                <p className="text-xs text-rp-cinza-medio mt-1">Separe múltiplos e-mails por vírgula.</p>
              </div>
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="flex gap-2 pt-1">
                <Button variant="primary" loading={sending} onClick={handleEnviar}>
                  <Send size={13} /> Enviar relatório
                </Button>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const sections = [
  '01 · Resumo executivo',
  '02 · Pontos positivos',
  '03 · Pontos de atenção',
  '04 · Recomendações',
  '05 · Plano de ação',
  '06 · Apêndice metodológico'
]

function formatPeriodo(periodo) {
  if (!periodo) return '—'
  const match = periodo.match(/^(\d{4})-Q(\d)$/)
  if (!match) return periodo
  const ord = { '1': '1.º', '2': '2.º', '3': '3.º', '4': '4.º' }
  return `${ord[match[2]] || match[2]} Trimestre ${match[1]}`
}

export default function Relatorios() {
  const [relatorio, setRelatorio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [showEnviar, setShowEnviar] = useState(false)

  useEffect(() => {
    relatorioService.listar()
      .then((data) => {
        const lista = data.data ?? []
        setRelatorio(lista[0] ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleExportPDF() {
    if (!relatorio) return
    setLoadingPDF(true)
    try {
      await relatorioService.baixarPdf(relatorio.id)
    } finally {
      setLoadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-rp-cinza-medio">Carregando relatório...</p>
      </div>
    )
  }

  if (!relatorio) {
    return (
      <div>
        <PageTitle title="Relatório executivo" subtitle="Gerado por IA · revisado pela consultoria" />
        <div className="bg-white rounded-xl p-12 shadow-card text-center">
          <div className="w-14 h-14 rounded-xl bg-rp-cinza-claro flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-rp-cinza-medio" />
          </div>
          <h3 className="text-base font-bold text-rp-texto mb-2">Nenhum relatório gerado</h3>
          <p className="text-sm text-rp-cinza-medio mb-6">Gere o primeiro relatório executivo da sua empresa baseado nos dados coletados.</p>
          <Button variant="primary" onClick={() => relatorioService.gerar('2026-Q2').catch(console.error)}>
            <Sparkles size={14} /> Gerar relatório
          </Button>
        </div>
      </div>
    )
  }

  const periodoLabel = formatPeriodo(relatorio.periodo)
  const empresa = relatorio.empresa ?? {}
  const colaboradores = relatorio.metadados?.colaboradores ?? '—'
  const setores = relatorio.metadados?.setores ?? '—'
  const pontosPositivos = relatorio.pontos_positivos ?? []
  const pontosAtencao = relatorio.pontos_atencao ?? []
  const recomendacoes = relatorio.recomendacoes ?? []
  const planoAcao = relatorio.plano_acao ?? []

  return (
    <div>
      <PageTitle
        title="Relatório executivo"
        subtitle={`Gerado por IA · revisado pela consultoria · ${periodoLabel}`}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rp-cinza-borda rounded-lg text-sm text-rp-texto font-medium hover:bg-rp-cinza-claro transition-colors">
          <Filter size={13} className="text-rp-cinza-medio" /> Período · {periodoLabel}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rp-cinza-borda rounded-lg text-sm text-rp-texto font-medium hover:bg-rp-cinza-claro transition-colors">
          <Briefcase size={13} className="text-rp-cinza-medio" /> Empresa · {empresa.nome_fantasia ?? '—'}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rp-cinza-borda rounded-lg text-sm text-rp-texto font-medium hover:bg-rp-cinza-claro transition-colors">
          <Copy size={13} className="text-rp-cinza-medio" /> Duplicar
        </button>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEnviar(true)}>
            <Send size={13} /> Enviar para diretoria
          </Button>
          <Button variant="primary" size="sm" loading={loadingPDF} onClick={handleExportPDF}>
            <Download size={13} /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-rp-laranja uppercase tracking-widest mb-1">
                  Relatório executivo · {periodoLabel}
                </p>
                <h2 className="text-xl font-bold text-rp-azul">Clima organizacional & riscos psicossociais</h2>
                <p className="text-sm text-rp-cinza-medio mt-1">
                  Empresa: {empresa.nome_fantasia ?? '—'} · {colaboradores} colaboradores · {setores} setores
                </p>
              </div>
              <div className="w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="14" stroke="#e2e6ec" strokeWidth="1.5" strokeDasharray="8 5" opacity="0.5"/>
                  <circle cx="20" cy="20" r="9" stroke="#003366" strokeWidth="1.5" opacity="0.7"/>
                  <circle cx="20" cy="20" r="4.5" stroke="#003366" strokeWidth="2"/>
                  <circle cx="20" cy="20" r="2" fill="#e67e22"/>
                  <circle cx="12" cy="16.5" r="1.8" fill="#003366" opacity="0.5"/>
                  <circle cx="27.5" cy="24" r="1.8" fill="#003366" opacity="0.5"/>
                  <circle cx="25" cy="12.5" r="1.5" fill="#e67e22"/>
                </svg>
              </div>
            </div>

            {relatorio.resumo_executivo && (
              <div className="border-l-4 border-rp-azul pl-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-rp-azul">Resumo executivo</h3>
                  <span className="text-[10px] font-bold text-white bg-rp-azul px-2 py-0.5 rounded-full">IA</span>
                </div>
                {relatorio.resumo_executivo.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className={`text-sm text-rp-texto leading-relaxed ${i > 0 ? 'mt-3' : ''}`}
                    dangerouslySetInnerHTML={{
                      __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                ))}
              </div>
            )}

            {(pontosPositivos.length > 0 || pontosAtencao.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {pontosPositivos.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={15} className="text-green-600" />
                      <h4 className="text-sm font-bold text-green-700">Pontos positivos</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {pontosPositivos.map((p, i) => (
                        <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                          <span className="mt-1 flex-shrink-0">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pontosAtencao.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={15} className="text-orange-600" />
                      <h4 className="text-sm font-bold text-orange-700">Pontos de atenção</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {pontosAtencao.map((p, i) => (
                        <li key={i} className="text-xs text-orange-800 flex items-start gap-2">
                          <span className="mt-1 flex-shrink-0">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {recomendacoes.length > 0 && (
              <div className="border-l-4 border-rp-azul pl-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold text-rp-azul">Recomendações</h3>
                  <span className="text-[10px] font-bold text-rp-laranja bg-orange-100 px-2 py-0.5 rounded-full">CONSULTORIA</span>
                </div>
                <ol className="space-y-2">
                  {recomendacoes.map((r, i) => (
                    <li key={i} className="text-sm text-rp-texto flex items-start gap-2">
                      <span className="font-bold text-rp-azul flex-shrink-0">{i + 1}.</span> {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {planoAcao.length > 0 && (
              <div className="border-l-4 border-rp-cinza-borda pl-4">
                <h3 className="text-sm font-bold text-rp-texto mb-3">Plano de ação</h3>
                <div className="space-y-2">
                  {planoAcao.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="font-semibold text-rp-laranja flex-shrink-0 w-20 text-xs">{item.prazo}</span>
                      <span className="flex-1 text-rp-texto">{item.acao}</span>
                      <span className="text-xs text-rp-cinza-medio flex-shrink-0">{item.responsavel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <h4 className="text-xs font-bold text-rp-texto uppercase tracking-wide mb-3">Conteúdo</h4>
            <div className="space-y-1">
              {sections.map((s, i) => (
                <button key={i} className={`w-full text-left text-xs py-2 px-2 rounded-lg transition-colors ${i === 0 ? 'text-rp-azul font-semibold bg-rp-azul-suave' : 'text-rp-cinza-medio hover:bg-rp-cinza-claro'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: '#002244' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-rp-laranja" />
              <span className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest">IA · revisado pela consultoria</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Documento gerado por análise automatizada e validado pela equipe da Sara Linhar Consultoria{relatorio.revisado_em ? ` em ${formatDate(relatorio.revisado_em)}` : ''}.
            </p>
          </div>
        </div>
      </div>

      {showEnviar && (
        <EnviarModal relatorioId={relatorio.id} onClose={() => setShowEnviar(false)} />
      )}
    </div>
  )
}
