import { useState, useRef } from 'react'
import { Upload, Download, X, CheckCircle, AlertCircle, ArrowLeft, ClipboardPaste, Mail } from 'lucide-react'
import { Button } from './Button'
import { colaboradorService } from '../../services/adminService'

/*
 * Importação em lote de colaboradores — assistente em 3 etapas:
 *   1. entrada   → colar células da planilha (Excel/Sheets) ou enviar CSV
 *   2. previa    → mapeamento automático de colunas + validação linha a linha ANTES de importar
 *   3. resultado → resumo do que foi importado
 * O backend não muda: enviamos um CSV normalizado (cabeçalhos e ';') gerado aqui.
 */

const CAMPOS = [
  { id: 'nome',          label: 'Nome *',    sin: ['nome', 'nomecompleto', 'colaborador', 'funcionario', 'empregado'] },
  { id: 'email',         label: 'E-mail *',  sin: ['email', 'emailcorporativo', 'emailpessoal', 'mail'] },
  { id: 'cpf',           label: 'CPF',       sin: ['cpf', 'documento'] },
  { id: 'cargo',         label: 'Cargo',     sin: ['cargo', 'funcao', 'posicao'] },
  { id: 'unidade',       label: 'Unidade',   sin: ['unidade', 'area', 'unidadearea', 'filial', 'local'] },
  { id: 'setor',         label: 'Setor *',   sin: ['setor', 'departamento', 'depto', 'equipe', 'time'] },
  { id: 'data_admissao', label: 'Admissão',  sin: ['dataadmissao', 'admissao', 'datadeadmissao', 'dataentrada', 'datacontratacao'] },
]

function normalizar(s) {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function detectarSeparador(linha) {
  const contagens = ['\t', ';', ','].map((sep) => [sep, (linha.match(new RegExp(sep === '\t' ? '\\t' : sep, 'g')) ?? []).length])
  contagens.sort((a, b) => b[1] - a[1])
  return contagens[0][1] > 0 ? contagens[0][0] : ';'
}

// Divide uma linha respeitando aspas ("São Paulo; SP")
function splitLinha(linha, sep) {
  const out = []
  let cur = ''
  let emAspas = false
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i]
    if (ch === '"') {
      if (emAspas && linha[i + 1] === '"') { cur += '"'; i++ }
      else emAspas = !emAspas
    } else if (ch === sep && !emAspas) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

function mapearCabecalho(celulas) {
  return celulas.map((c) => {
    const n = normalizar(c)
    return CAMPOS.find((f) => f.sin.includes(n))?.id ?? ''
  })
}

function parseTexto(texto) {
  const linhasBrutas = texto.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '')
  if (linhasBrutas.length === 0) return null

  const sep = detectarSeparador(linhasBrutas[0])
  const grade = linhasBrutas.map((l) => splitLinha(l, sep))
  const nCols = Math.max(...grade.map((r) => r.length))
  grade.forEach((r) => { while (r.length < nCols) r.push('') })

  // A 1ª linha é cabeçalho se alguma célula bater com um campo conhecido e não parecer dado (sem "@")
  const mapa1 = mapearCabecalho(grade[0])
  const pareceCabecalho = mapa1.some(Boolean) && !grade[0].some((c) => c.includes('@'))

  let colunas
  let linhas
  if (pareceCabecalho) {
    colunas = mapa1
    linhas = grade.slice(1)
  } else {
    // Sem cabeçalho: chuta a ordem padrão e deixa o usuário ajustar na prévia
    colunas = CAMPOS.slice(0, nCols).map((f) => f.id)
    while (colunas.length < nCols) colunas.push('')
    linhas = grade
  }
  return { colunas, linhas }
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function dataValida(v) {
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v)
}

function montarRegistros(linhas, colunas) {
  const emailsVistos = new Set()
  return linhas.map((celulas) => {
    const reg = {}
    colunas.forEach((campo, i) => { if (campo) reg[campo] = (celulas[i] ?? '').trim() })

    const problemas = []
    if (!reg.nome) problemas.push('nome vazio')
    if (!reg.email) problemas.push('e-mail vazio')
    else if (!RE_EMAIL.test(reg.email)) problemas.push('e-mail inválido')
    else if (emailsVistos.has(reg.email.toLowerCase())) problemas.push('e-mail repetido na lista')
    if (reg.email && RE_EMAIL.test(reg.email)) emailsVistos.add(reg.email.toLowerCase())
    if (!reg.setor) problemas.push('setor vazio')
    if (reg.data_admissao && !dataValida(reg.data_admissao)) problemas.push('data inválida (use dd/mm/aaaa)')

    return { celulas, reg, problemas }
  })
}

function gerarCsv(registros) {
  const esc = (v) => {
    const s = v ?? ''
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = 'nome;email;cpf;cargo;unidade;setor;data_admissao'
  const linhas = registros.map(({ reg }) =>
    [reg.nome, reg.email, reg.cpf, reg.cargo, reg.unidade, reg.setor, reg.data_admissao].map(esc).join(';')
  )
  return [header, ...linhas].join('\n')
}

export function ImportCsvModal({ onClose, onImported }) {
  const inputRef = useRef()
  const [etapa, setEtapa] = useState('entrada') // 'entrada' | 'previa' | 'resultado'
  const [texto, setTexto] = useState('')
  const [colunas, setColunas] = useState([])
  const [linhas, setLinhas] = useState([])
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  function irParaPrevia(conteudo) {
    const parsed = parseTexto(conteudo)
    if (!parsed || parsed.linhas.length === 0) {
      setError('Não encontrei dados. Cole ao menos uma linha com nome, e-mail e setor.')
      return
    }
    setError('')
    setColunas(parsed.colunas)
    setLinhas(parsed.linhas)
    setEtapa('previa')
  }

  function lerArquivo(file, encoding = 'utf-8') {
    const reader = new FileReader()
    reader.onload = () => {
      const conteudo = String(reader.result ?? '')
      // Excel pt-BR costuma salvar CSV em ANSI: se vier caractere quebrado, relê como latin-1
      if (encoding === 'utf-8' && conteudo.includes('�')) {
        lerArquivo(file, 'iso-8859-1')
        return
      }
      irParaPrevia(conteudo)
    }
    reader.onerror = () => setError('Não consegui ler o arquivo.')
    reader.readAsText(file, encoding)
  }

  function handleFile(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo acima de 10MB.'); return }
    lerArquivo(file)
  }

  const registros = etapa === 'previa' ? montarRegistros(linhas, colunas) : []
  const validos = registros.filter((r) => r.problemas.length === 0)
  const invalidos = registros.length - validos.length
  const faltaNome = !colunas.includes('nome')
  const faltaEmail = !colunas.includes('email')
  const faltaSetor = !colunas.includes('setor')
  const mapeamentoIncompleto = faltaNome || faltaEmail || faltaSetor

  function mudarColuna(idx, valor) {
    setColunas((prev) => prev.map((c, i) => {
      if (i === idx) return valor
      return c === valor ? '' : c // um campo só pode apontar pra uma coluna
    }))
  }

  function removerLinha(idx) {
    setLinhas((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleImportar() {
    if (validos.length === 0) return
    setImporting(true)
    setError('')
    try {
      const csv = gerarCsv(validos)
      const file = new File([new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })], 'colaboradores.csv', { type: 'text/csv' })
      const res = await colaboradorService.importar(file)
      setResultado(res)
      setEtapa('resultado')
      onImported?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao importar dados.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full my-4 transition-all ${etapa === 'previa' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-rp-cinza-borda">
          <div>
            <h2 className="text-base font-bold text-rp-azul">
              {etapa === 'previa' ? 'Confira antes de importar' : 'Adicionar colaboradores em lote'}
            </h2>
            <p className="text-xs text-rp-cinza-medio mt-0.5">
              {etapa === 'entrada' && 'Cole direto da sua planilha ou envie um arquivo CSV'}
              {etapa === 'previa' && `${validos.length} pronto${validos.length !== 1 ? 's' : ''} para importar${invalidos > 0 ? ` · ${invalidos} com problema` : ''}`}
              {etapa === 'resultado' && 'Importação concluída'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-rp-cinza-medio hover:bg-rp-cinza-claro">
            <X size={16} />
          </button>
        </div>

        {/* ── Etapa 1: entrada ── */}
        {etapa === 'entrada' && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-rp-texto mb-2">
                <ClipboardPaste size={14} className="text-rp-azul" /> Cole aqui as células da planilha
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onPaste={(e) => {
                  const colado = e.clipboardData?.getData('text') ?? ''
                  if (colado.includes('\n') || colado.includes('\t')) {
                    e.preventDefault()
                    irParaPrevia(colado) // colou uma tabela: já mostra a prévia
                  }
                }}
                rows={7}
                placeholder={'Selecione as linhas no Excel ou Google Sheets (com ou sem cabeçalho), copie (Ctrl+C) e cole aqui (Ctrl+V).\n\nExemplo:\nMaria Silva   maria@empresa.com   Analista   Financeiro\nJoão Souza    joao@empresa.com    Vendedor   Comercial'}
                className="w-full text-xs font-mono border border-rp-cinza-borda rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rp-azul resize-none"
              />
              <p className="text-[11px] text-rp-cinza-medio mt-1">
                Colunas reconhecidas: nome, e-mail, CPF, cargo, unidade, setor e admissão — em qualquer ordem. Você confere tudo antes de importar.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-rp-cinza-borda" />
              <span className="text-[11px] font-semibold text-rp-cinza-medio uppercase">ou</span>
              <div className="flex-1 border-t border-rp-cinza-borda" />
            </div>

            <div
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-rp-cinza-borda rounded-xl py-4 px-4 text-center cursor-pointer hover:border-rp-azul/40 hover:bg-rp-azul-suave/30 transition-colors"
            >
              <p className="text-sm font-medium text-rp-cinza-medio flex items-center justify-center gap-2">
                <Upload size={15} /> Arraste um arquivo CSV ou clique para selecionar
              </p>
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>

            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div className="flex gap-2">
              <Button variant="primary" fullWidth disabled={!texto.trim()} onClick={() => irParaPrevia(texto)}>
                Conferir dados
              </Button>
              <button
                onClick={() => colaboradorService.baixarTemplate()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rp-cinza-borda text-xs text-rp-cinza-medio hover:bg-rp-cinza-claro transition-colors whitespace-nowrap"
              >
                <Download size={12} /> Baixar modelo
              </button>
            </div>
          </div>
        )}

        {/* ── Etapa 2: prévia ── */}
        {etapa === 'previa' && (
          <div className="px-6 py-5 space-y-4">
            {mapeamentoIncompleto && (
              <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                <AlertCircle size={13} className="flex-shrink-0" />
                Indique qual coluna é {[faltaNome && 'o Nome', faltaEmail && 'o E-mail', faltaSetor && 'o Setor'].filter(Boolean).join(', ')} usando os seletores no topo da tabela.
              </div>
            )}

            <div className="border border-rp-cinza-borda rounded-xl overflow-hidden">
              <div className="overflow-auto max-h-80">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-rp-cinza-claro z-10">
                    <tr>
                      <th className="px-2 py-2 w-8" />
                      {colunas.map((campo, i) => (
                        <th key={i} className="px-2 py-2 text-left">
                          <select
                            value={campo}
                            onChange={(e) => mudarColuna(i, e.target.value)}
                            className={`w-full text-[11px] font-semibold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-rp-azul ${campo ? 'border-rp-cinza-borda text-rp-azul bg-white' : 'border-yellow-400 text-yellow-700 bg-yellow-50'}`}
                          >
                            <option value="">Ignorar coluna</option>
                            {CAMPOS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                          </select>
                        </th>
                      ))}
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map(({ celulas, problemas }, idx) => (
                      <tr key={idx} className={`border-t border-rp-cinza-borda/60 ${problemas.length ? 'bg-red-50/60' : ''}`}>
                        <td className="px-2 py-1.5 text-center">
                          {problemas.length === 0
                            ? <CheckCircle size={13} className="text-green-600 inline" />
                            : <span title={problemas.join(' · ')}><AlertCircle size={13} className="text-red-500 inline" /></span>}
                        </td>
                        {celulas.map((c, i) => (
                          <td key={i} className={`px-2 py-1.5 whitespace-nowrap max-w-[180px] truncate ${colunas[i] ? 'text-rp-texto' : 'text-rp-cinza-medio/60 line-through'}`}>
                            {c || <span className="text-rp-cinza-medio/50">—</span>}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removerLinha(idx)}
                            title="Remover esta linha"
                            className="text-rp-cinza-medio hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidos > 0 && (
                <div className="px-3 py-2 bg-red-50 border-t border-rp-cinza-borda text-[11px] text-red-700">
                  Linhas marcadas com <AlertCircle size={11} className="inline -mt-0.5" /> não serão importadas — passe o mouse no ícone para ver o motivo, corrija na planilha e cole de novo, ou remova a linha.
                </div>
              )}
            </div>

            <p className="text-[11px] text-rp-cinza-medio">
              Setores e unidades que não existirem serão criados automaticamente. E-mails já cadastrados terão os dados atualizados (não duplica).
            </p>

            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEtapa('entrada'); setError('') }}>
                <ArrowLeft size={13} /> Voltar
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={importing}
                disabled={validos.length === 0 || mapeamentoIncompleto}
                onClick={handleImportar}
              >
                <Upload size={13} /> Importar {validos.length} colaborador{validos.length !== 1 ? 'es' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* ── Etapa 3: resultado ── */}
        {etapa === 'resultado' && resultado && (
          <div className="px-6 py-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle size={24} />
              <span className="font-semibold">{resultado.importados} colaborador{resultado.importados !== 1 ? 'es' : ''} importado{resultado.importados !== 1 ? 's' : ''}</span>
            </div>
            {resultado.setores_criados > 0 && (
              <p className="text-xs text-rp-cinza-medio">
                {resultado.setores_criados} setor{resultado.setores_criados !== 1 ? 'es' : ''} criado{resultado.setores_criados !== 1 ? 's' : ''} automaticamente.
              </p>
            )}
            {resultado.erros?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 text-left">
                <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {resultado.erros.length} linha{resultado.erros.length !== 1 ? 's' : ''} recusada{resultado.erros.length !== 1 ? 's' : ''} pelo servidor
                </p>
                <ul className="text-xs text-red-600 space-y-0.5">
                  {resultado.erros.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {resultado.erros.length > 5 && <li>...e mais {resultado.erros.length - 5} erros</li>}
                </ul>
              </div>
            )}
            <div className="bg-rp-azul-suave/50 rounded-lg px-4 py-3 text-left flex items-start gap-2">
              <Mail size={14} className="text-rp-azul flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rp-texto">
                Os importados ainda não têm senha: use o ícone de envelope na lista para enviar o convite de acesso a cada um.
              </p>
            </div>
            <Button variant="primary" fullWidth onClick={onClose}>Fechar</Button>
          </div>
        )}
      </div>
    </div>
  )
}
