import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { ResultadosView } from '../../../components/ead/ResultadosView'
import { plataformaEadService } from '../../../services/plataformaService'

export default function CursoResultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [empresaId, setEmpresaId] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(() => {
    setLoading(true)
    plataformaEadService.resultados(id, empresaId || undefined)
      .then((res) => { setDados(res); setEmpresas(res.empresas ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, empresaId])

  useEffect(() => { carregar() }, [carregar])

  if (loading && !dados) return <LoadingState />

  return (
    <div>
      <button onClick={() => navigate(`/plataforma/ead/cursos/${id}`)} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4"><ArrowLeft size={16} /> Voltar ao curso</button>
      <PageTitle
        title="Índices do curso"
        subtitle={dados?.curso?.titulo}
        action={
          <a href={plataformaEadService.exportarUrl(id, empresaId || undefined)} target="_blank" rel="noreferrer">
            <Button variant="outline"><Download size={14} /> Exportar CSV</Button>
          </a>
        }
      />

      <div className="mb-4 max-w-xs">
        <select className="input-field appearance-none bg-white" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
          <option value="">Todas as empresas</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>

      <ResultadosView resumo={dados?.resumo} colaboradores={dados?.colaboradores} mostrarEmpresa={!empresaId} />
    </div>
  )
}
