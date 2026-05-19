import { useState, useRef } from 'react'
import { Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { colaboradorService } from '../../services/adminService'

export function ImportCsvModal({ onClose, onImported }) {
  const inputRef = useRef()
  const [arquivo, setArquivo] = useState(null)
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file) setArquivo(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) setArquivo(file)
  }

  async function handleImportar() {
    if (!arquivo) return
    setImporting(true)
    setError('')
    try {
      const res = await colaboradorService.importar(arquivo)
      setResultado(res)
      onImported?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao importar arquivo.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <div>
            <h2 className="text-base font-bold text-rp-azul">Importar estrutura e colaboradores</h2>
            <p className="text-xs text-rp-cinza-medio mt-0.5">CSV com separador ponto-e-vírgula · até 10MB</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {resultado ? (
            <div className="text-center py-2 space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={24} />
                <span className="font-semibold">{resultado.importados} colaboradores importados</span>
              </div>
              {resultado.setores_criados > 0 && (
                <p className="text-xs text-rp-cinza-medio">
                  {resultado.setores_criados} setor{resultado.setores_criados !== 1 ? 'es' : ''} criado{resultado.setores_criados !== 1 ? 's' : ''} automaticamente.
                </p>
              )}
              {resultado.erros?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 text-left">
                  <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {resultado.erros.length} linha{resultado.erros.length !== 1 ? 's' : ''} com erro
                  </p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {resultado.erros.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {resultado.erros.length > 5 && <li>...e mais {resultado.erros.length - 5} erros</li>}
                  </ul>
                </div>
              )}
              <Button variant="primary" fullWidth onClick={onClose}>Fechar</Button>
            </div>
          ) : (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-rp-cinza-borda rounded-xl py-8 px-4 text-center cursor-pointer hover:border-rp-azul/40 hover:bg-rp-azul-suave/30 transition-colors"
              >
                <Upload size={24} className="text-rp-cinza-borda mx-auto mb-2" />
                {arquivo ? (
                  <p className="text-sm font-semibold text-rp-azul">{arquivo.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-rp-cinza-medio">Arraste seu arquivo aqui</p>
                    <p className="text-xs text-rp-cinza-medio mt-1">ou clique para selecionar</p>
                  </>
                )}
                <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
              </div>

              <div className="bg-rp-cinza-claro rounded-lg px-4 py-3 text-xs text-rp-cinza-medio">
                <p className="font-semibold mb-1">Colunas esperadas:</p>
                <code className="text-rp-azul">nome; email; cpf; cargo; unidade; setor; data_admissao</code>
                <p className="mt-2">A coluna unidade tambem pode vir como area. Setores inexistentes serao criados na unidade informada.</p>
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-2">
                <Button variant="primary" loading={importing} onClick={handleImportar} fullWidth>
                  <Upload size={13} /> Importar arquivo
                </Button>
                <button
                  onClick={() => colaboradorService.baixarTemplate()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rp-cinza-borda text-xs text-rp-cinza-medio hover:bg-rp-cinza-claro transition-colors whitespace-nowrap"
                >
                  <Download size={12} /> Baixar modelo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
