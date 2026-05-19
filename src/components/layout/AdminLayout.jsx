import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AdminHeader } from './AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'
import { OnboardingWizard } from '../ui/OnboardingWizard'

export function AdminLayout() {
  const { admin, loading, marcarOnboardingConcluido } = useAuth()

  if (loading) return <LoadingState />
  if (!admin) return <Navigate to="/admin/login" replace />
  if (admin.perfil === 'super_admin') return <Navigate to="/plataforma" replace />

  const mostrarWizard = admin.onboarding_concluido === false

  return (
    <div className="flex h-screen bg-rp-cinza-claro overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[248px]">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          {mostrarWizard && (
            <OnboardingWizard onConcluir={marcarOnboardingConcluido} />
          )}
          <div className="p-6 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
