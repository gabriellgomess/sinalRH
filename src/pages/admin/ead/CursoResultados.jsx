import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { ResultadosView } from '../../../components/ead/ResultadosView'
import { eadAdminService } from '../../../services/adminService'

export default function CursoResultadosAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(() => {
    setLoading(true)
    eadAdminService.resultados(id)
      .then(setDados)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  if (loading && !dados) return <LoadingState />

  return (
    <div>
      <button onClick={() => navigate('/admin/ead/cursos')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4"><ArrowLeft size={16} /> Treinamentos</button>
      <PageTitle
        title="Índices de execução e notas"
        subtitle={dados?.curso?.titulo}
        action={
          <a href={eadAdminService.exportarUrl(id)} target="_blank" rel="noreferrer">
            <Button variant="outline"><Download size={14} /> Exportar CSV</Button>
          </a>
        }
      />
      <ResultadosView resumo={dados?.resumo} colaboradores={dados?.colaboradores} />
    </div>
  )
}
