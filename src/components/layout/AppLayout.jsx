import { Outlet, Navigate } from 'react-router-dom'
import { MobileBottomNav } from './MobileBottomNav'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'

export function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col min-h-screen bg-rp-cinza-claro max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}
