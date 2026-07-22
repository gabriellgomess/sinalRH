import { Paperclip, FileText, Download } from 'lucide-react'

/**
 * Renderiza o conteudo de uma aula (video YouTube, video upload, texto e anexos).
 * PDFs e imagens sao exibidos INLINE na tela (com rolagem); demais formatos
 * ficam como link de download (fallback).
 * props:
 *  - aula: { titulo, tipo, conteudo, video_youtube_id, tem_video, anexos[] }
 *  - videoSrc: URL do video (upload) já resolvida
 *  - verHref: (anexoId) => URL de exibição inline
 *  - anexoHref: (anexoId) => URL de download (fallback)
 */
export function AulaViewer({ aula, videoSrc, verHref, anexoHref }) {
  if (!aula) return null

  const isPdf = (a) => (a.nome_original || '').toLowerCase().endsWith('.pdf')
  const isImagem = (a) => a.categoria === 'imagem'

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

      {aula.conteudo && (
        <div className="ead-prose text-sm text-rp-texto" dangerouslySetInnerHTML={{ __html: aula.conteudo }} />
      )}

      {(aula.anexos ?? []).length > 0 && (
        <div className="space-y-4">
          {aula.anexos.map((a) => {
            if (isImagem(a)) {
              return (
                <figure key={a.id}>
                  <img src={verHref(a.id)} alt={a.nome_original} className="w-full rounded-xl border border-rp-cinza-borda" />
                  <figcaption className="mt-1 text-xs text-rp-cinza-medio">{a.nome_original}</figcaption>
                </figure>
              )
            }
            if (isPdf(a)) {
              return (
                <div key={a.id} className="rounded-xl border border-rp-cinza-borda overflow-hidden bg-rp-cinza-claro">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-rp-cinza-borda bg-white">
                    <FileText size={14} className="text-rp-azul" />
                    <span className="text-xs font-medium text-rp-texto truncate">{a.nome_original}</span>
                  </div>
                  <iframe
                    src={`${verHref(a.id)}#toolbar=0`}
                    title={a.nome_original}
                    className="w-full block"
                    style={{ height: '75vh', minHeight: '480px' }}
                  />
                </div>
              )
            }
            // Demais formatos (docx, xlsx, etc.): sem preview no navegador -> download.
            return (
              <a
                key={a.id}
                href={anexoHref(a.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm bg-white border border-rp-cinza-borda rounded-lg px-3 py-2 hover:border-rp-azul transition-colors"
              >
                <Paperclip size={15} className="text-rp-azul" />
                <span className="flex-1 truncate text-rp-texto">{a.nome_original}</span>
                <Download size={14} className="text-rp-cinza-medio" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
