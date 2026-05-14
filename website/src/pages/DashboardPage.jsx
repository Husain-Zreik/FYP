import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const logout  = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {user && (
            <div className="space-y-3">
              <Row label="Name"  value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role"  value={user.role} />
              {user.phone && <Row label="Phone" value={user.phone} />}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
