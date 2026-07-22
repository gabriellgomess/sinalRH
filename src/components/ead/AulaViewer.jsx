import { Paperclip, Image as ImageIcon, FileText } from 'lucide-react'

/**
 * Renderiza o conteudo de uma aula (video YouTube, video upload, texto e anexos).
 * props:
 *  - aula: { titulo, tipo, conteudo, video_youtube_id, tem_video, anexos[] }
 *  - videoSrc: URL do video (upload) já resolvida
 *  - anexoHref: (anexoId) => URL de download
 */
export function AulaViewer({ aula, videoSrc, anexoHref }) {
  if (!aula) return null

  return (
    <div className="space-y-4">
      {aula.tipo === 'video_youtube' && aula.video_youtube_id && (
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${aula.video_youtube_id}`}
            title={aula.titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {aula.tipo === 'video_upload' && aula.tem_video && videoSrc && (
        <video controls controlsList="nodownload" className="w-full rounded-xl bg-black" src={videoSrc} preload="metadata" />
      )}

      {aula.tipo === 'texto' && aula.conteudo && (
        <div className="ead-prose text-sm text-rp-texto" dangerouslySetInnerHTML={{ __html: aula.conteudo }} />
      )}

      {aula.conteudo && aula.tipo !== 'texto' && (
        <div className="ead-prose text-sm text-rp-texto" dangerouslySetInnerHTML={{ __html: aula.conteudo }} />
      )}

      {(aula.anexos ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">Materiais</p>
          <ul className="space-y-1.5">
            {aula.anexos.map((a) => (
              <li key={a.id}>
                <a
                  href={anexoHref(a.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm bg-white border border-rp-cinza-borda rounded-lg px-3 py-2 hover:border-rp-azul transition-colors"
                >
                  {a.categoria === 'imagem' ? <ImageIcon size={15} className="text-rp-azul" /> : <FileText size={15} className="text-rp-azul" />}
                  <span className="flex-1 truncate text-rp-texto">{a.nome_original}</span>
                  <Paperclip size={13} className="text-rp-cinza-medio" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
