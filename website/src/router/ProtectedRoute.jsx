import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute() {
  const initialized     = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!initialized) return null

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
