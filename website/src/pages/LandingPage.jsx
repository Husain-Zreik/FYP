import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-3">Welcome</h1>
      <p className="text-gray-500 mb-8 text-center max-w-sm">
        Platform description goes here once the project name is decided.
      </p>
      <Link
        to="/login"
        className="bg-gray-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Sign in
      </Link>
    </div>
  )
}
