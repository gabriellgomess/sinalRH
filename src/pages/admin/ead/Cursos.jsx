import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, Eye, BarChart3 } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { eadAdminService } from '../../../services/adminService'

export default function EadCursosAdmin() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eadAdminService.listarCursos()
      .then((res) => setCursos(res.data ?? []))
      .catch(() => setCursos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageTitle title="Treinamentos (EAD)" subtitle="Cursos liberados para sua empresa" />

      {loading ? (
        <LoadingState />
      ) : cursos.length === 0 ? (
        <EmptyState icon={<GraduationCap size={44} />} title="Nenhum curso liberado" description="Assim que cursos forem liberados para sua empresa, eles aparecem aqui." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-card p-5">
              <div className="w-10 h-10 rounded-lg bg-rp-azul-suave flex items-center justify-center text-rp-azul mb-3">
                <BookOpen size={20} />
              </div>
              <h3 className="text-sm font-semibold text-rp-texto mb-1 line-clamp-2">{c.titulo}</h3>
              <p className="text-xs text-rp-cinza-medio">{c.total_aulas} aulas</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/ead/cursos/${c.id}/visualizar`)}>
                  <Eye size={14} /> Visualizar
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate(`/admin/ead/cursos/${c.id}/resultados`)}>
                  <BarChart3 size={14} /> Índices
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
