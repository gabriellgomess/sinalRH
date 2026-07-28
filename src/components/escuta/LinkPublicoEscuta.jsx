import { useEffect, useState } from 'react'
import { Link2, Copy, Check, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Download } from 'lucide-react'
import QRCode from 'qrcode'
import { escutaAdminService } from '../../services/adminService'

/**
 * Configuração do link público de relato anônimo (sem login).
 * Endpoint restrito a role admin — em 403 o card simplesmente não aparece.
 */
export function LinkPublicoEscuta() {
  const [config, setConfig] = useState(null)
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [qr, setQr] = useState('')

  useEffect(() => {
    escutaAdminService.configPublico().then(setConfig).catch(() => setConfig(null))
  }, [])

  // QR do link para divulgação impressa (mural, cartaz)
  useEffect(() => {
    if (!config?.ativa || !config?.url) { setQr(''); return }
    QRCode.toDataURL(config.url, { width: 640, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(''))
  }, [config?.ativa, config?.url])

  function baixarQr() {
    const a = document.createElement('a')
    a.href = qr
    a.download = `qrcode-canal-escuta-${config.slug}.png`
    a.click()
  }

  if (!config) return null

  async function acao(fn, confirmar) {
    if (confirmar && !window.confirm(confirmar)) return
    setSalvando(true)
    setErro('')
    try {
      setConfig(await fn())
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível concluir a ação.')
    } finally {
      setSalvando(false)
    }
  }

  function copiar() {
    navigator.clipboard?.writeText(config.url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-card mb-4 overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-rp-cinza-claro/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Link2 size={16} className="text-rp-azul" />
          <span className="text-sm font-semibold text-rp-texto">Link público de relato anônimo</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            config.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {config.ativa ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
        {aberto ? <ChevronUp size={16} className="text-rp-cinza-medio" /> : <ChevronDown size={16} className="text-rp-cinza-medio" />}
      </button>

      {aberto && (
        <div className="px-5 pb-5 pt-1 border-t border-rp-cinza-borda">
          <p className="text-xs text-rp-cinza-medio leading-relaxed mb-4">
            Uma página sem login onde qualquer pessoa da empresa pode registrar um relato
            totalmente anônimo e receber um protocolo para acompanhar a resposta.
            Divulgue o link internamente (mural, intranet, e-mail).
          </p>

          {!config.produto_ativo && (
            <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 rounded-lg px-3 py-2.5 mb-4">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs">O produto Canal de Escuta não está ativo para esta empresa.</p>
            </div>
          )}

          {config.ativa && config.url && (
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-rp-texto mb-1.5">Link para divulgação</label>
              <div className="flex gap-2">
                <input readOnly value={config.url}
                  className="flex-1 border border-rp-cinza-borda rounded-lg px-3 py-2 text-xs font-mono text-rp-texto bg-rp-cinza-claro/50 focus:outline-none" />
                <button onClick={copiar}
                  className="flex items-center gap-1.5 px-3 rounded-lg border border-rp-cinza-borda text-xs font-semibold text-rp-texto hover:border-rp-azul transition-colors">
                  {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-[11px] text-rp-cinza-medio mt-2">
                Acompanhamento pelo protocolo: <span className="font-mono">{config.url_acompanhamento}</span>
              </p>

              {qr && (
                <div className="flex items-center gap-4 mt-4 p-4 bg-rp-cinza-claro/50 rounded-xl">
                  <img src={qr} alt="QR code do canal de escuta" className="w-28 h-28 rounded-lg bg-white p-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-rp-texto mb-1">QR code para divulgação</p>
                    <p className="text-[11px] text-rp-cinza-medio leading-relaxed mb-2">
                      Imprima em cartaz ou mural. Quem apontar a câmera cai direto na página
                      de relato anônimo.
                    </p>
                    <button onClick={baixarQr}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rp-azul hover:underline">
                      <Download size={13} /> Baixar PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}

          <div className="flex flex-wrap gap-2">
            {config.ativa ? (
              <>
                <button
                  onClick={() => acao(escutaAdminService.desativarPublico, 'Desativar o link público? A página deixará de aceitar novos relatos.')}
                  disabled={salvando}
                  className="py-2 px-4 rounded-lg border border-rp-cinza-borda text-xs font-semibold text-rp-cinza-medio hover:bg-rp-cinza-claro transition-colors disabled:opacity-40">
                  Desativar
                </button>
                <button
                  onClick={() => acao(escutaAdminService.regenerarSlug, 'Gerar um novo link? O link atual deixará de funcionar imediatamente e precisará ser divulgado de novo.')}
                  disabled={salvando}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-lg border border-rp-cinza-borda text-xs font-semibold text-rp-texto hover:border-rp-azul transition-colors disabled:opacity-40">
                  <RefreshCw size={13} /> Gerar novo link
                </button>
              </>
            ) : (
              <button
                onClick={() => acao(escutaAdminService.ativarPublico)}
                disabled={salvando || !config.produto_ativo}
                className="py-2 px-4 rounded-lg bg-rp-azul text-white text-xs font-semibold hover:bg-rp-azul-deep transition-colors disabled:opacity-40">
                {salvando ? 'Ativando...' : 'Ativar link público'}
              </button>
            )}
          </div>

          <p className="text-[11px] text-rp-cinza-medio mt-3 leading-relaxed">
            Use "Gerar novo link" se o endereço vazar para fora da empresa. Relatos já enviados
            continuam válidos e acessíveis pelo protocolo.
          </p>
        </div>
      )}
    </div>
  )
}
