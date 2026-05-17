import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// accessPoint: 'government' | 'shelter' | null (any authenticated user)
export default function ProtectedRoute({ accessPoint = null }) {
  const initialized     = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user            = useAuthStore((s) => s.user)

  if (!initialized) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // If a specific access point is required, enforce it
  if (accessPoint && user?.access_point !== accessPoint) {
    if (user?.access_point === 'shelter')     return <Navigate to="/shelter"    replace />
    if (user?.access_point === 'government')  return <Navigate to="/dashboard"  replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
