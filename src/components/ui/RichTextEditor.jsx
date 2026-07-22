import { useRef, useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Heading2, Undo } from 'lucide-react'

/**
 * Editor de texto rico leve baseado em contentEditable (sem dependencia externa).
 * Emite HTML via onChange. O HTML e sanitizado no backend antes de persistir.
 */
export function RichTextEditor({ value = '', onChange, placeholder = 'Escreva o conteúdo da aula...' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(cmd, arg = null) {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
    emit()
  }

  function emit() {
    onChange?.(ref.current?.innerHTML ?? '')
  }

  const ToolBtn = ({ onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="p-2 rounded-md text-rp-cinza-medio hover:bg-rp-cinza-claro hover:text-rp-azul transition-colors"
    >
      {children}
    </button>
  )

  return (
    <div className="border border-rp-cinza-borda rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-rp-cinza-borda bg-rp-cinza-claro">
        <ToolBtn title="Negrito" onClick={() => exec('bold')}><Bold size={15} /></ToolBtn>
        <ToolBtn title="Itálico" onClick={() => exec('italic')}><Italic size={15} /></ToolBtn>
        <ToolBtn title="Subtítulo" onClick={() => exec('formatBlock', '<h2>')}><Heading2 size={15} /></ToolBtn>
        <ToolBtn title="Lista" onClick={() => exec('insertUnorderedList')}><List size={15} /></ToolBtn>
        <ToolBtn title="Lista numerada" onClick={() => exec('insertOrderedList')}><ListOrdered size={15} /></ToolBtn>
        <ToolBtn title="Desfazer" onClick={() => exec('undo')}><Undo size={15} /></ToolBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="rte-content min-h-[160px] px-4 py-3 text-sm text-rp-texto focus:outline-none prose-sm max-w-none"
      />
    </div>
  )
}
