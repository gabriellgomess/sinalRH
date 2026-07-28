import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AdminHeader } from './AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'
import { OnboardingWizard } from '../ui/OnboardingWizard'
import { PermissoesProvider, usePermissoes } from '../../contexts/PermissoesContext'

// Primeiro segmento de /admin/<x> => módulo exigido (espelha o backend)
const ROTA_MODULO = {
  dashboard: 'dashboard', riscos: 'mapa_riscos', pesquisas: 'pesquisas',
  checkins: 'checkins', nr1: 'nr1', escuta: 'canal_escuta', ead: 'ead',
  comunicados: 'comunicados', relatorios: 'relatorios', colaboradores: 'pessoas',
  empresas: 'empresa', configuracoes: 'configuracoes',
}

/**
 * Impede acesso por URL direta a módulo sem permissão. O bloqueio real é no
 * backend; aqui é só para o usuário não cair numa tela vazia de erros.
 */
function GuardaPermissao({ children }) {
  const { pode, carregando, somenteLeitura } = usePermissoes()
  const { pathname } = useLocation()

  const segmento = pathname.split('/')[2]
  const modulo = ROTA_MODULO[segmento]

  if (!carregando && modulo && !pode(modulo)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <>
      {somenteLeitura && (
        <div className="flex items-center gap-2 bg-blue-50 border-b border-blue-100 px-6 py-2">
          <Eye size={13} className="text-blue-700 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Seu perfil é <strong>somente leitura</strong>: você acompanha os indicadores, mas não pode alterar dados.
          </p>
        </div>
      )}
      {children}
    </>
  )
}

export function AdminLayout() {
  const { admin, loading, marcarOnboardingConcluido } = useAuth()

  if (loading) return <LoadingState />
  if (!admin) return <Navigate to="/admin/login" replace />
  if (admin.perfil === 'super_admin') return <Navigate to="/plataforma" replace />

  const mostrarWizard = admin.onboarding_concluido === false

  return (
    <PermissoesProvider>
      <div className="flex h-screen bg-rp-cinza-claro overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[248px]">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">
            <GuardaPermissao>
              {mostrarWizard && (
                <OnboardingWizard onConcluir={marcarOnboardingConcluido} />
              )}
              <div className="p-6 max-w-[1400px]">
                <Outlet />
              </div>
            </GuardaPermissao>
          </main>
        </div>
      </div>
    </PermissoesProvider>
  )
}
