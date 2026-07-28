import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, Lock, Send, Copy, Check, Download, EyeOff, MailQuestion } from 'lucide-react'
import { escutaPublicoService } from '../../services/escutaPublicoService'

const categorias = [
  'clima_equipe', 'carga_trabalho', 'lideranca', 'assedio_discriminacao',
  'condicoes_ambiente', 'reconhecimento_carreira', 'comunicacao_interna',
  'sugestao_melhoria', 'outro'
]

const categoriaLabels = {
  clima_equipe: 'Clima da equipe',
  carga_trabalho: 'Sobrecarga de trabalho',
  lideranca: 'Relacionamento com a liderança',
  assedio_discriminacao: 'Assédio ou discriminação',
  condicoes_ambiente: 'Condições do ambiente',
  reconhecimento_carreira: 'Reconhecimento e carreira',
  comunicacao_interna: 'Comunicação interna',
  sugestao_melhoria: 'Sugestão de melhoria',
  outro: 'Outro'
}

const alvos = [
  { value: 'colaborador_setor', label: 'Colaborador ou setor' },
  { value: 'lideranca',         label: 'Liderança' },
  { value: 'rh',                label: 'RH' },
  { value: 'diretoria',         label: 'Diretoria' },
  { value: 'presidencia',       label: 'Presidência' },
  { value: 'nao_sabe',          label: 'Não sei informar' },
  { value: 'nao_informar',      label: 'Prefiro não informar' },
]

export default function EscutaPublica() {
  const { slug } = useParams()
  const [canal, setCanal] = useState(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const [categoria, setCategoria] = useState('')
  const [tipoEnvolvido, setTipoEnvolvido] = useState('')
  const [setorId, setSetorId] = useState('')
  const [texto, setTexto] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot — usuários reais nunca preenchem

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [protocolo, setProtocolo] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    escutaPublicoService.canal(slug)
      .then(setCanal)
      .catch(() => setNaoEncontrado(true))
  }, [slug])

  async function handleSubmit() {
    if (!texto.trim() || !categoria || !tipoEnvolvido) return
    setLoading(true)
    setError('')
    try {
      const data = await escutaPublicoService.enviar(slug, {
        categoria,
        tipo_envolvido: tipoEnvolvido,
        setor_id: setorId || null,
        texto,
        email_notificacao: email.trim() || null,
        form_token: canal.form_token,
        website
      })
      setProtocolo(data.protocolo)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function copiarProtocolo() {
    navigator.clipboard?.writeText(protocolo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function baixarProtocolo() {
    const conteudo = [
      'Canal de Escuta — Comprovante de relato',
      canal?.empresa?.nome ? `Empresa: ${canal.empresa.nome}` : '',
      `Protocolo: ${protocolo}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      '',
      'Guarde este protocolo. Ele é a única forma de acompanhar a resposta em:',
      `${window.location.origin}/escuta/acompanhar`
    ].filter(Boolean).join('\n')
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `protocolo-${protocolo}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (naoEncontrado) {
    return (
      <div className="min-h-screen bg-rp-cinza-claro flex flex-col items-center justify-center px-6 text-center">
        <Shield size={40} className="text-rp-cinza-medio mb-4" />
        <h1 className="text-lg font-bold text-rp-azul mb-2">Canal não encontrado</h1>
        <p className="text-sm text-rp-cinza-medio max-w-sm">
          Este link não está ativo. Confirme o endereço com a sua empresa.
        </p>
      </div>
    )
  }

  if (!canal) {
    return (
      <div className="min-h-screen bg-rp-cinza-claro flex items-center justify-center">
        <p className="text-sm text-rp-cinza-medio">Carregando...</p>
      </div>
    )
  }

  // ── Tela de sucesso: protocolo exibido UMA única vez ──
  if (protocolo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
            <Shield size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-rp-azul mb-2">Relato registrado com segurança</h2>
          <p className="text-sm text-rp-cinza-medio mb-6">
            Guarde o protocolo abaixo. <strong>Ele não será exibido novamente</strong> e é a
            única forma de acompanhar a resposta.
          </p>

          <div className="bg-rp-cinza-claro border-2 border-dashed border-rp-cinza-borda rounded-2xl px-4 py-5 mb-4">
            <p className="text-2xl font-mono font-bold tracking-wider text-rp-azul break-all">{protocolo}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button onClick={copiarProtocolo}
              className="flex items-center justify-center gap-2 border border-rp-cinza-borda rounded-xl py-3 text-sm font-semibold text-rp-texto hover:border-rp-azul transition-all">
              {copiado ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={baixarProtocolo}
              className="flex items-center justify-center gap-2 border border-rp-cinza-borda rounded-xl py-3 text-sm font-semibold text-rp-texto hover:border-rp-azul transition-all">
              <Download size={16} />
              Baixar .txt
            </button>
          </div>

          <p className="text-xs text-rp-cinza-medio mb-4">
            Primeiro retorno em até <strong>{canal.sla_dias} dias úteis</strong>.
          </p>
          <Link to="/escuta/acompanhar" className="text-sm font-semibold text-rp-laranja hover:underline">
            Ir para o acompanhamento →
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulário ──
  return (
    <div className="min-h-screen bg-rp-cinza-claro flex flex-col">
      <div className="bg-white px-5 pt-6 pb-4 border-b border-rp-cinza-borda">
        {canal.empresa.logo_url && (
          <img src={canal.empresa.logo_url} alt="" className="h-10 mb-3 object-contain" />
        )}
        <h1 className="text-xl font-bold text-rp-azul">Canal de Escuta</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">{canal.empresa.nome} · Anônimo · Sem login</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg w-full mx-auto">
        <div className="bg-rp-azul-suave rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-start gap-2">
            <EyeOff size={14} className="text-rp-azul flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rp-azul leading-relaxed">
              <strong>Este relato é anônimo de verdade.</strong> Não há login, não pedimos seu nome
              e não registramos seu endereço de internet junto ao relato.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-rp-azul flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rp-azul leading-relaxed">
              Você receberá um <strong>protocolo</strong> para acompanhar a resposta, com primeiro
              retorno em até <strong>{canal.sla_dias} dias úteis</strong>.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">Categoria do relato</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input-field">
            <option value="">Selecione uma categoria</option>
            {categorias.map((c) => <option key={c} value={c}>{categoriaLabels[c]}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">Sobre quem ou qual área é o relato?</label>
          <select value={tipoEnvolvido} onChange={(e) => setTipoEnvolvido(e.target.value)} className="input-field">
            <option value="">Selecione</option>
            {alvos.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <p className="text-[11px] text-rp-cinza-medio mt-1.5">
            Isso garante que seu relato chegue ao grupo certo, sem conflito de interesse.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">
            Seu setor <span className="font-normal text-rp-cinza-medio">(opcional)</span>
          </label>
          <select value={setorId} onChange={(e) => setSetorId(e.target.value)} className="input-field">
            <option value="">Prefiro não informar</option>
            {canal.setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-2">Conte com suas palavras</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva o que aconteceu, há quanto tempo, e quem está envolvido..."
            rows={6}
            className="w-full input-field resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-rp-texto mb-1 flex items-center gap-1.5">
            <MailQuestion size={13} className="text-rp-cinza-medio" />
            E-mail para aviso de resposta <span className="font-normal text-rp-cinza-medio">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="input-field"
          />
          <p className="text-[11px] text-rp-cinza-medio mt-1.5">
            Se preferir anonimato total, deixe em branco. O e-mail serve apenas para avisar que há
            resposta — nunca é mostrado à empresa e o aviso não contém o protocolo nem o conteúdo.
          </p>
        </div>

        {/* Honeypot — invisível para pessoas, alvo de robôs */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          name="website"
          tabIndex="-1"
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={!texto.trim() || !categoria || !tipoEnvolvido || loading}
          className="w-full bg-rp-laranja text-white font-semibold rounded-xl py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rp-laranja-claro active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {loading ? 'Enviando...' : 'Enviar relato anônimo'}
        </button>

        <p className="text-center text-xs text-rp-cinza-medio pb-6">
          Já enviou um relato?{' '}
          <Link to="/escuta/acompanhar" className="text-rp-laranja font-semibold hover:underline">
            Acompanhar pelo protocolo
          </Link>
        </p>
      </div>
    </div>
  )
}
